import { chunkTracker } from "@/lib/chunk-tracker";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Chunked Upload Status
 *
 * GET /api/items/chunked/status?uploadId=xxx
 * GET /api/items/chunked/status (all active uploads)
 *
 * Debugging and monitoring endpoint for chunked upload sessions.
 * Returns status information about active uploads.
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const uploadId = searchParams.get("uploadId");

    if (uploadId) {
      // Get status for specific upload
      const stats = chunkTracker.getStats(uploadId);
      const parts = chunkTracker.getUploadParts(uploadId);

      if (!stats) {
        return NextResponse.json(
          { error: "Upload not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        uploadId,
        stats: {
          ...stats,
          uploadedChunks: parts.length,
        },
        parts: parts.map((part) => ({
          partNumber: part.PartNumber,
          etag: part.ETag,
        })),
        isActive: true,
      });
    } else {
      // Get overall status and memory stats
      const activeUploads = chunkTracker.getActiveUploads();
      const memoryStats = chunkTracker.getMemoryStats();

      const uploadStatuses = activeUploads.map((id) => {
        const stats = chunkTracker.getStats(id);
        const parts = chunkTracker.getUploadParts(id);

        return {
          uploadId: id,
          uploadedChunks: parts.length,
          createdAt: stats?.createdAt,
        };
      });

      return NextResponse.json({
        activeUploads: activeUploads.length,
        memoryStats,
        uploads: uploadStatuses,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Error getting chunked upload status:", error);
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 },
    );
  }
}
