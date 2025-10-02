import { chunkTracker } from "@/lib/chunk-tracker";
import { formatItemForFrontend } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import {
  completeChunkedUpload,
  getFileExtension,
  getFileTypeCategory,
} from "@ketryon/aws";
import { db, items, users } from "@ketryon/database";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/**
 * Complete Chunked Upload
 *
 * POST /api/items/chunked/complete
 *
 * Completes the S3 multipart upload, creates the database record,
 * updates user storage, and cleans up the ETag tracker.
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
    const { uploadId, s3Key, fileName, fileSize, totalChunks, mimeType } = body;

    // Validate required fields
    if (!uploadId || typeof uploadId !== "string") {
      return NextResponse.json(
        { error: "uploadId is required and must be a string" },
        { status: 400 },
      );
    }

    if (!s3Key || typeof s3Key !== "string") {
      return NextResponse.json(
        { error: "s3Key is required and must be a string" },
        { status: 400 },
      );
    }

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

    if (!totalChunks || typeof totalChunks !== "number" || totalChunks <= 0) {
      return NextResponse.json(
        { error: "totalChunks is required and must be a positive number" },
        { status: 400 },
      );
    }

    // Verify all chunks have been uploaded
    if (!chunkTracker.isComplete(uploadId, totalChunks)) {
      const stats = chunkTracker.getStats(uploadId);
      return NextResponse.json(
        {
          error: "Upload incomplete",
          details: {
            uploadedChunks: stats?.uploadedChunks || 0,
            totalChunks,
            missingChunks: totalChunks - (stats?.uploadedChunks || 0),
          },
        },
        { status: 400 },
      );
    }

    // Get all uploaded parts for S3 completion
    const parts = chunkTracker.getUploadParts(uploadId);
    if (parts.length !== totalChunks) {
      return NextResponse.json(
        {
          error: "Chunk count mismatch",
          details: {
            expectedChunks: totalChunks,
            receivedChunks: parts.length,
          },
        },
        { status: 400 },
      );
    }

    // Get the calculated parent ID from initialization (for folder hierarchy)
    const calculatedParentId = chunkTracker.getParentId(uploadId);

    // Complete the S3 multipart upload
    const s3Result = await completeChunkedUpload(uploadId, s3Key, parts);

    // Determine file type for database
    const fileExtension = getFileExtension(fileName);
    const fileCategory = getFileTypeCategory(fileName);

    // Create database record (following existing patterns)
    const [newItem] = await db
      .insert(items)
      .values({
        userId: user.id,
        parentId: calculatedParentId, // Use folder-specific parent from initialization
        name: fileName,
        type: "file",
        fileType: fileExtension,
        sizeBytes: fileSize,
        mimeType: mimeType || "application/octet-stream",
        filePath: s3Key, // Store S3 key for future operations
      })
      .returning();

    // Update user's storage usage (following existing patterns)
    await db
      .update(users)
      .set({
        storageUsed: user.storageUsed + fileSize,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Clean up the ETag tracker
    chunkTracker.cleanup(uploadId);

    return NextResponse.json({
      success: true,
      item: formatItemForFrontend(newItem),
      s3Key: s3Result.key,
      s3Url: s3Result.url,
      category: fileCategory,
      size: fileSize,
      mimeType: mimeType || "application/octet-stream",
      message: "Chunked upload completed successfully",
    });
  } catch (error) {
    console.error("Error completing chunked upload:", error);

    // Try to clean up on error
    try {
      const body = await request.json();
      if (body.uploadId) {
        chunkTracker.cleanup(body.uploadId);
      }
    } catch (cleanupError) {
      console.error("Failed to cleanup after error:", cleanupError);
    }

    return NextResponse.json(
      { error: "Failed to complete chunked upload" },
      { status: 500 },
    );
  }
}
