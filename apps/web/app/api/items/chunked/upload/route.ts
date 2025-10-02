import { chunkTracker } from "@/lib/chunk-tracker";
import { auth } from "@clerk/nextjs/server";
import { uploadChunk } from "@ketryon/aws";
import { NextRequest, NextResponse } from "next/server";

/**
 * Upload Single Chunk
 *
 * POST /api/items/chunked/upload
 *
 * Uploads a single chunk of a file to S3 and tracks its ETag.
 * Each request is stateless - all necessary information is provided in the request.
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse FormData
    const formData = await request.formData();

    // Extract required fields
    const uploadId = formData.get("uploadId") as string;
    const s3Key = formData.get("s3Key") as string;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const totalChunks = parseInt(formData.get("totalChunks") as string);
    const chunk = formData.get("chunk") as File;

    // Validate required fields
    if (!uploadId) {
      return NextResponse.json(
        { error: "uploadId is required" },
        { status: 400 },
      );
    }

    if (!s3Key) {
      return NextResponse.json({ error: "s3Key is required" }, { status: 400 });
    }

    if (isNaN(chunkIndex) || chunkIndex < 0) {
      return NextResponse.json(
        { error: "chunkIndex must be a non-negative number" },
        { status: 400 },
      );
    }

    if (isNaN(totalChunks) || totalChunks <= 0) {
      return NextResponse.json(
        { error: "totalChunks must be a positive number" },
        { status: 400 },
      );
    }

    if (!chunk || !(chunk instanceof File)) {
      return NextResponse.json(
        { error: "chunk file is required" },
        { status: 400 },
      );
    }

    // Convert chunk to Buffer
    const arrayBuffer = await chunk.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload chunk to S3 (S3 parts start at 1, not 0)
    const partNumber = chunkIndex + 1;
    const partResult = await uploadChunk(uploadId, s3Key, partNumber, buffer);

    // Track the chunk ETag
    chunkTracker.addChunk(uploadId, chunkIndex, partResult.ETag);

    // Calculate progress
    const uploadedChunks = chunkTracker.getUploadParts(uploadId).length;
    const progress = (uploadedChunks / totalChunks) * 100;
    const isComplete = chunkTracker.isComplete(uploadId, totalChunks);

    return NextResponse.json({
      success: true,
      chunkIndex,
      uploadedChunks,
      totalChunks,
      progress: Math.round(progress * 100) / 100, // Round to 2 decimal places
      isComplete,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully`,
    });
  } catch (error) {
    console.error("Error uploading chunk:", error);
    return NextResponse.json(
      { error: "Failed to upload chunk" },
      { status: 500 },
    );
  }
}
