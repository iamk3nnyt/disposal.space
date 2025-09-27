import { formatFileSize, formatItemForFrontend } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import {
  fileProcessor,
  getFileExtension,
  getFileTypeCategory,
} from "@ketryon/aws";
import { db, items, users, type SelectUser } from "@ketryon/database";
import { and, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/items - Fetch user's items
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get("parentId");
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    // Build query conditions
    const conditions = [eq(items.userId, user.id)];

    if (parentId) {
      conditions.push(eq(items.parentId, parentId));
    } else {
      conditions.push(isNull(items.parentId));
    }

    if (!includeDeleted) {
      conditions.push(eq(items.isDeleted, false));
    }

    const userItems = await db
      .select()
      .from(items)
      .where(and(...conditions))
      .orderBy(items.type, items.name);

    const formattedItems = userItems.map(formatItemForFrontend);

    return NextResponse.json({
      items: formattedItems,
      user: {
        storageUsed: user.storageUsed,
        storageLimit: user.storageLimit,
        storageUsedFormatted: formatFileSize(user.storageUsed),
        storageUsedPercentage: Math.round(
          (user.storageUsed / user.storageLimit) * 100,
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Helper function to handle folder creation
async function handleFolderCreation(request: NextRequest, user: SelectUser) {
  const body = await request.json();
  const { name, type, parentId } = body;

  // Validate required fields
  if (!name || !type) {
    return NextResponse.json(
      { error: "Name and type are required" },
      { status: 400 },
    );
  }

  // Only allow folder creation via JSON
  if (type !== "folder") {
    return NextResponse.json(
      {
        error: "Only folders can be created via JSON. Use FormData for files.",
      },
      { status: 400 },
    );
  }

  // Create the folder
  const [newItem] = await db
    .insert(items)
    .values({
      userId: user.id,
      parentId: parentId || null,
      name,
      type: "folder",
      fileType: null,
      sizeBytes: 0,
      mimeType: null,
      filePath: null,
    })
    .returning();

  return NextResponse.json({
    item: formatItemForFrontend(newItem),
    message: "Folder created successfully",
  });
}

// Helper function to handle file upload
async function handleFileUpload(
  request: NextRequest,
  user: SelectUser,
  clerkUserId: string,
) {
  // Parse form data
  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const parentId = formData.get("parentId") as string | null;

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const uploadResults = [];
  let totalSize = 0;

  // Create a map to store created folders to avoid duplicates
  const createdFolders = new Map<string, string>();

  // Helper function to create folder hierarchy
  const createFolderHierarchy = async (
    relativePath: string,
    userId: string,
    rootParentId: string | null,
  ): Promise<string | null> => {
    const pathParts = relativePath.split("/").filter((part) => part.length > 0);

    // If no path parts, return the root parent
    if (pathParts.length === 0) return rootParentId;

    // Remove the filename (last part) to get folder path
    const folderParts = pathParts.slice(0, -1);
    if (folderParts.length === 0) return rootParentId;

    let currentParentId = rootParentId;
    let currentPath = "";

    for (const folderName of folderParts) {
      currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

      // Check if we already created this folder
      if (createdFolders.has(currentPath)) {
        currentParentId = createdFolders.get(currentPath)!;
        continue;
      }

      // Check if folder already exists in database
      const [existingFolder] = await db
        .select()
        .from(items)
        .where(
          and(
            eq(items.userId, userId),
            currentParentId
              ? eq(items.parentId, currentParentId)
              : isNull(items.parentId),
            eq(items.name, folderName),
            eq(items.type, "folder"),
            eq(items.isDeleted, false),
          ),
        )
        .limit(1);

      if (existingFolder) {
        currentParentId = existingFolder.id;
        createdFolders.set(currentPath, existingFolder.id);
      } else {
        // Create new folder
        const [newFolder] = await db
          .insert(items)
          .values({
            userId,
            parentId: currentParentId,
            name: folderName,
            type: "folder",
            sizeBytes: 0,
          })
          .returning();

        currentParentId = newFolder.id;
        createdFolders.set(currentPath, newFolder.id);
      }
    }

    return currentParentId;
  };

  // Process each file
  for (const file of files) {
    try {
      // Check storage limit before processing
      if (user.storageUsed + file.size > user.storageLimit) {
        return NextResponse.json(
          {
            error: `Storage limit exceeded. File "${file.name}" would exceed your ${Math.round(user.storageLimit / (1024 * 1024 * 1024))}GB limit.`,
            currentUsage: user.storageUsed,
            limit: user.storageLimit,
            fileSize: file.size,
          },
          { status: 413 },
        );
      }

      // Get the relative path from webkitdirectory uploads
      const relativePath =
        (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
        file.name;

      // Create folder hierarchy if needed
      const fileParentId = await createFolderHierarchy(
        relativePath,
        user.id,
        parentId,
      );

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to S3 with validation and security scanning
      const uploadResult = await fileProcessor.uploadAndProcess(
        buffer,
        file.name,
        clerkUserId,
      );

      // Determine file type for database
      const fileExtension = getFileExtension(file.name);
      const fileCategory = getFileTypeCategory(file.name);

      // Create database record
      const [newItem] = await db
        .insert(items)
        .values({
          userId: user.id,
          parentId: fileParentId,
          name: file.name,
          type: "file",
          fileType: fileExtension,
          sizeBytes: file.size,
          mimeType: uploadResult.mimeType,
          filePath: uploadResult.key, // Store S3 key for future operations
        })
        .returning();

      totalSize += file.size;

      uploadResults.push({
        file: formatItemForFrontend(newItem),
        s3Key: uploadResult.key,
        s3Url: uploadResult.url,
        category: fileCategory,
        size: file.size,
        mimeType: uploadResult.mimeType,
      });
    } catch (fileError) {
      console.error(`Error processing file ${file.name}:`, fileError);

      // Return specific error for this file
      return NextResponse.json(
        {
          error: `Failed to process file "${file.name}": ${fileError instanceof Error ? fileError.message : "Unknown error"}`,
          fileName: file.name,
        },
        { status: 400 },
      );
    }
  }

  // Update user's storage usage
  await db
    .update(users)
    .set({
      storageUsed: user.storageUsed + totalSize,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return NextResponse.json({
    message: `Successfully uploaded ${files.length} file(s)`,
    files: uploadResults,
    totalSize,
    newStorageUsed: user.storageUsed + totalSize,
    storageLimit: user.storageLimit,
  });
}

// POST /api/items - Create items (folders via JSON, files via FormData)
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Smart content-type detection
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("multipart/form-data")) {
      // Handle file upload
      return handleFileUpload(request, user, clerkUserId);
    } else if (contentType?.includes("application/json")) {
      // Handle folder creation
      return handleFolderCreation(request, user);
    } else {
      return NextResponse.json(
        {
          error:
            "Unsupported content type. Use 'application/json' for folders or 'multipart/form-data' for files.",
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create item",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
