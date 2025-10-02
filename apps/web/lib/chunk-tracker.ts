/**
 * ETag Tracker - Minimal state management for chunked uploads
 *
 * This utility provides lightweight, in-memory tracking of S3 multipart upload ETags.
 * It follows the industry-standard stateless approach used by AWS S3 and other
 * cloud-native services.
 *
 * Key Features:
 * - Minimal memory footprint (only stores ETags)
 * - Automatic cleanup when uploads complete
 * - Thread-safe operations
 * - No database dependencies
 * - Follows existing infrastructure patterns
 */

export interface ChunkInfo {
  ETag: string;
  PartNumber: number;
}

export interface UploadStats {
  uploadId: string;
  totalChunks: number;
  uploadedChunks: number;
  isComplete: boolean;
  createdAt: Date;
}

class ChunkTracker {
  // uploadId → { chunkIndex → ETag }
  private chunks = new Map<string, Map<number, string>>();

  // uploadId → creation timestamp (for cleanup)
  private timestamps = new Map<string, Date>();

  /**
   * Add a chunk ETag to the tracker
   */
  addChunk(uploadId: string, chunkIndex: number, etag: string): void {
    if (!this.chunks.has(uploadId)) {
      this.chunks.set(uploadId, new Map());
      this.timestamps.set(uploadId, new Date());
    }

    this.chunks.get(uploadId)!.set(chunkIndex, etag);
  }

  /**
   * Get all uploaded parts for S3 completion (sorted by part number)
   */
  getUploadParts(uploadId: string): ChunkInfo[] {
    const chunkMap = this.chunks.get(uploadId);
    if (!chunkMap) return [];

    return Array.from(chunkMap.entries())
      .sort(([a], [b]) => a - b) // Sort by chunk index
      .map(([chunkIndex, etag]) => ({
        ETag: etag,
        PartNumber: chunkIndex + 1, // S3 parts start at 1, not 0
      }));
  }

  /**
   * Check if upload is complete (all chunks received)
   */
  isComplete(uploadId: string, totalChunks: number): boolean {
    const chunkMap = this.chunks.get(uploadId);
    return chunkMap ? chunkMap.size === totalChunks : false;
  }

  /**
   * Get upload progress statistics
   */
  getStats(uploadId: string): UploadStats | null {
    const chunkMap = this.chunks.get(uploadId);
    const timestamp = this.timestamps.get(uploadId);

    if (!chunkMap || !timestamp) return null;

    return {
      uploadId,
      totalChunks: 0, // Will be provided by caller
      uploadedChunks: chunkMap.size,
      isComplete: false, // Will be determined by caller with totalChunks
      createdAt: timestamp,
    };
  }

  /**
   * Clean up completed or failed upload
   */
  cleanup(uploadId: string): void {
    this.chunks.delete(uploadId);
    this.timestamps.delete(uploadId);
  }

  /**
   * Schedule automatic cleanup after timeout (default: 30 minutes)
   */
  scheduleCleanup(uploadId: string, timeoutMs = 30 * 60 * 1000): void {
    setTimeout(() => {
      this.cleanup(uploadId);
    }, timeoutMs);
  }

  /**
   * Get all active upload IDs (for debugging)
   */
  getActiveUploads(): string[] {
    return Array.from(this.chunks.keys());
  }

  /**
   * Clean up stale uploads (older than specified age)
   */
  cleanupStaleUploads(maxAgeMs = 60 * 60 * 1000): number {
    // Default: 1 hour
    const now = new Date();
    let cleanedCount = 0;

    for (const [uploadId, timestamp] of this.timestamps.entries()) {
      if (now.getTime() - timestamp.getTime() > maxAgeMs) {
        this.cleanup(uploadId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    activeUploads: number;
    totalChunks: number;
    estimatedMemoryKB: number;
  } {
    let totalChunks = 0;

    for (const chunkMap of this.chunks.values()) {
      totalChunks += chunkMap.size;
    }

    // Rough estimate: each ETag is ~32 chars + overhead
    const estimatedMemoryKB = Math.round((totalChunks * 50) / 1024);

    return {
      activeUploads: this.chunks.size,
      totalChunks,
      estimatedMemoryKB,
    };
  }
}

// Singleton instance following existing patterns
export const chunkTracker = new ChunkTracker();

// Auto-cleanup stale uploads every 15 minutes
setInterval(
  () => {
    const cleaned = chunkTracker.cleanupStaleUploads();
    if (cleaned > 0) {
      console.log(`[ChunkTracker] Cleaned up ${cleaned} stale uploads`);
    }
  },
  15 * 60 * 1000,
);
