import { createFolderHierarchy } from "@/lib/folder-traversal";
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

// SSE Event types for categorized events
interface SSEEvent {
  category: "upload" | "delete" | "move" | "rename";
  type: "progress" | "completed" | "error";
  data: {
    progress?: number;
    phase?: string;
    message: string;
    itemId?: string;
    fileName?: string;
    totalFiles?: number;
    processedFiles?: number;
    currentFile?: string;
    totalSize?: number;
  };
}

// Helper function to handle file upload with SSE streaming
async function handleFileUploadWithSSE(
  request: NextRequest,
  user: SelectUser,
  clerkUserId: string,
) {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send SSE event helper
      const sendSSEEvent = (event: SSEEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      };

      try {
        // Parse form data
        const formData = await request.formData();
        const files = formData.getAll("files") as File[];
        const filePaths = formData.getAll("filePaths") as string[];
        const parentId = formData.get("parentId") as string | null;

        if (!files || files.length === 0) {
          sendSSEEvent({
            category: "upload",
            type: "error",
            data: { message: "No files provided" },
          });
          controller.close();
          return;
        }

        const uploadResults = [];
        let totalSize = 0;

        // Helper function to create folder hierarchy using unified resolver
        const createFolderHierarchyFromPath = async (
          relativePath: string,
          userId: string,
          rootParentId: string | null,
        ): Promise<string | null> => {
          const pathParts = relativePath
            .split("/")
            .filter((part) => part.length > 0);

          // If no path parts, return the root parent
          if (pathParts.length === 0) return rootParentId;

          // Remove the filename (last part) to get folder path
          const folderParts = pathParts.slice(0, -1);

          if (folderParts.length === 0) {
            return rootParentId;
          }

          // Use unified folder hierarchy creator
          const result = await createFolderHierarchy(
            folderParts,
            userId,
            rootParentId,
          );
          return result.folderId;
        };

        // Send initial progress
        sendSSEEvent({
          category: "upload",
          type: "progress",
          data: {
            phase: "validation",
            message: "Validating files...",
            progress: 5,
            totalFiles: files.length,
            processedFiles: 0,
          },
        });

        // Calculate total size of all files to check if batch would exceed limit
        const totalBatchSize = files.reduce((sum, file) => sum + file.size, 0);
        const availableStorage = user.storageLimit - user.storageUsed;
        if (totalBatchSize > availableStorage) {
          sendSSEEvent({
            category: "upload",
            type: "error",
            data: {
              message: `Insufficient storage space. Upload size: ${formatFileSize(totalBatchSize)}, Available: ${formatFileSize(availableStorage)}`,
            },
          });
          controller.close();
          return;
        }

        // Process each file with proper monotonic progress calculation
        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          try {
            // Calculate progress using linear model:
            // - Each file gets equal allocation: 90% / totalFiles
            // - Current file phases get remaining 10% / totalFiles
            // - Ensures monotonic progress that never goes backwards
            const phaseAllocation = 10 / files.length; // 10% for current file phases
            const completedFilesProgress = (i / files.length) * 90;

            // Progress: File validation (25% of current file phases)
            const validationProgress =
              completedFilesProgress + phaseAllocation * 0.25;
            sendSSEEvent({
              category: "upload",
              type: "progress",
              data: {
                phase: "processing",
                message: `Processing ${file.name}...`,
                progress: Math.round(validationProgress * 100) / 100,
                totalFiles: files.length,
                processedFiles: i,
                currentFile: file.name,
              },
            });

            // Get the relative path from the separate filePaths array or fallback to webkitRelativePath
            const relativePath =
              filePaths[i] ||
              (file as File & { webkitRelativePath?: string })
                .webkitRelativePath ||
              file.name;

            // Create folder hierarchy if needed
            const fileParentId = await createFolderHierarchyFromPath(
              relativePath,
              user.id,
              parentId,
            );

            // Convert File to Buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Progress: S3 upload (75% of current file phases)
            const uploadProgress =
              completedFilesProgress + phaseAllocation * 0.75;
            sendSSEEvent({
              category: "upload",
              type: "progress",
              data: {
                phase: "uploading",
                message: `Uploading ${file.name} to cloud storage...`,
                progress: Math.round(uploadProgress * 100) / 100,
                totalFiles: files.length,
                processedFiles: i,
                currentFile: file.name,
              },
            });

            // Upload to S3 with validation and security scanning
            const uploadResult = await fileProcessor.uploadAndProcess(
              buffer,
              file.name,
              clerkUserId,
            );

            // Progress: Database operations (95% of current file phases)
            const dbProgress = completedFilesProgress + phaseAllocation * 0.95;
            sendSSEEvent({
              category: "upload",
              type: "progress",
              data: {
                phase: "finalizing",
                message: `Finalizing ${file.name}...`,
                progress: Math.round(dbProgress * 100) / 100,
                totalFiles: files.length,
                processedFiles: i,
                currentFile: file.name,
              },
            });

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

            // Progress: File completed (full allocation for this file)
            const fileCompletedProgress = ((i + 1) / files.length) * 90;
            sendSSEEvent({
              category: "upload",
              type: "progress",
              data: {
                phase: "completed",
                message: `${file.name} completed successfully`,
                progress: Math.round(fileCompletedProgress * 100) / 100,
                totalFiles: files.length,
                processedFiles: i + 1,
                currentFile: file.name,
              },
            });
          } catch (fileError) {
            console.error(`Error processing file ${file.name}:`, fileError);

            sendSSEEvent({
              category: "upload",
              type: "error",
              data: {
                message: `Failed to process ${file.name}: ${fileError instanceof Error ? fileError.message : "Unknown error"}`,
              },
            });
            controller.close();
            return;
          }
        }

        // Final progress: Updating storage (95% total progress)
        sendSSEEvent({
          category: "upload",
          type: "progress",
          data: {
            phase: "finalizing",
            message: "Updating storage usage...",
            progress: 95,
            totalFiles: files.length,
            processedFiles: files.length,
          },
        });

        // Update user's storage usage
        await db
          .update(users)
          .set({
            storageUsed: user.storageUsed + totalSize,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        // Complete progress session
        sendSSEEvent({
          category: "upload",
          type: "completed",
          data: {
            message: `${uploadResults.length} file(s) uploaded successfully`,
            progress: 100,
            totalFiles: files.length,
            processedFiles: files.length,
            totalSize,
          },
        });

        controller.close();
      } catch (error) {
        console.error("Upload error:", error);
        sendSSEEvent({
          category: "upload",
          type: "error",
          data: {
            message: error instanceof Error ? error.message : "Upload failed",
          },
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}

// Helper function to handle file upload (non-streaming)
async function handleFileUpload(
  request: NextRequest,
  user: SelectUser,
  clerkUserId: string,
) {
  // Parse form data
  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const filePaths = formData.getAll("filePaths") as string[];
  const parentId = formData.get("parentId") as string | null;

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const uploadResults = [];
  let totalSize = 0;

  // Helper function to create folder hierarchy using unified resolver
  const createFolderHierarchyFromPath = async (
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

    // Use unified folder hierarchy creator
    const result = await createFolderHierarchy(
      folderParts,
      userId,
      rootParentId,
    );
    return result.folderId;
  };

  // Calculate total size of all files to check if batch would exceed limit
  const totalBatchSize = files.reduce((sum, file) => sum + file.size, 0);
  const availableStorage = user.storageLimit - user.storageUsed;
  if (totalBatchSize > availableStorage) {
    return NextResponse.json(
      {
        error: `Insufficient storage space. Upload size: ${formatFileSize(totalBatchSize)}, Available: ${formatFileSize(availableStorage)}`,
        currentUsage: user.storageUsed,
        limit: user.storageLimit,
        requestedSize: totalBatchSize,
        availableSpace: availableStorage,
      },
      { status: 413 },
    );
  }

  // Process each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      // Get the relative path from the separate filePaths array or fallback to webkitRelativePath
      const relativePath =
        filePaths[i] ||
        (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
        file.name;

      // Create folder hierarchy if needed
      const fileParentId = await createFolderHierarchyFromPath(
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

    const searchParams = request.nextUrl.searchParams;
    const streamProgress = searchParams.get("stream") === "true";
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("multipart/form-data")) {
      // Handle file upload with optional streaming
      if (streamProgress) {
        return handleFileUploadWithSSE(request, user, clerkUserId);
      } else {
        return handleFileUpload(request, user, clerkUserId);
      }
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
