import { chunkTracker } from "@/lib/chunk-tracker";
import { createFolderHierarchy } from "@/lib/folder-traversal";
import { formatFileSize } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { fileProcessor } from "@ketryon/aws";
import { db, users } from "@ketryon/database";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * Initialize Chunked Upload
 *
 * POST /api/items/chunked
 *
 * Creates a new S3 multipart upload session and returns the upload ID and S3 key.
 * This follows the stateless ETag tracking approach aligned with industry standards.
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { fileName, relativePath, fileSize, parentId } = body;

    // Validate required fields
    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json(
        { error: "fileName is required and must be a string" },
        { status: 400 },
      );
    }

    if (!fileSize || typeof fileSize !== "number" || fileSize <= 0) {
      return NextResponse.json(
        { error: "fileSize is required and must be a positive number" },
        { status: 400 },
      );
    }

    // Helper function to create folder hierarchy (same logic as SSE system)
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

    // Create folder hierarchy if needed (same logic as SSE system)
    const fileParentId = await createFolderHierarchyFromPath(
      relativePath || fileName,
      user.id,
      parentId || null,
    );

    // Check user storage limits (consistent with client-side validation)
    const totalUsedStorage = user.storageUsed || 0;
    const storageLimit = user.storageLimit || 15 * 1024 * 1024 * 1024; // 15GB default
    const availableStorage = storageLimit - totalUsedStorage;

    if (fileSize > availableStorage) {
      return NextResponse.json(
        {
          error: `Insufficient storage space. Upload size: ${formatFileSize(fileSize)}, Available: ${formatFileSize(availableStorage)}`,
          details: {
            currentUsage: totalUsedStorage,
            storageLimit,
            requestedSize: fileSize,
            availableSpace: availableStorage,
          },
        },
        { status: 413 },
      );
    }

    // Initialize S3 multipart upload
    const { uploadId, key } = await fileProcessor.initializeChunkedUpload(
      fileName,
      clerkUserId,
    );

    // Store the calculated parent ID in chunk tracker for completion
    chunkTracker.initializeUpload(uploadId, fileParentId);

    // Schedule automatic cleanup (30 minutes timeout)
    chunkTracker.scheduleCleanup(uploadId);

    return NextResponse.json({
      success: true,
      uploadId,
      s3Key: key,
      message: "Chunked upload initialized successfully",
    });
  } catch (error) {
    console.error("Error initializing chunked upload:", error);
    return NextResponse.json(
      { error: "Failed to initialize chunked upload" },
      { status: 500 },
    );
  }
}
