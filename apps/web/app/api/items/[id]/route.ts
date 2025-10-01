import { formatItemForFrontend } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { fileProcessor } from "@ketryon/aws";
import { db, items, users } from "@ketryon/database";
import { and, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// Helper function to get all descendant items (for folder deletion)
async function getAllDescendants(itemId: string, userId: string) {
  const directChildren = await db
    .select()
    .from(items)
    .where(and(eq(items.parentId, itemId), eq(items.userId, userId)));

  let allDescendants = [...directChildren];

  for (const child of directChildren) {
    if (child.type === "folder") {
      const childDescendants = await getAllDescendants(child.id, userId);
      allDescendants = [...allDescendants, ...childDescendants];
    }
  }

  return allDescendants;
}

// GET /api/items/[id] - Get item metadata, download file, or get preview URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const download = searchParams.get("download") === "true";
    const preview = searchParams.get("preview") === "true";

    // Get the item from database
    const [item] = await db
      .select()
      .from(items)
      .where(
        and(
          eq(items.id, id),
          eq(items.userId, user.id),
          eq(items.isDeleted, false),
        ),
      )
      .limit(1);

    if (!item) {
      return NextResponse.json(
        { error: "Item not found or access denied" },
        { status: 404 },
      );
    }

    // Handle folder requests
    if (item.type === "folder") {
      if (download || preview) {
        return NextResponse.json(
          { error: "Cannot download or preview folders" },
          { status: 400 },
        );
      }

      // Return folder metadata
      return NextResponse.json({
        item: formatItemForFrontend(item),
      });
    }

    // Handle file requests
    if (!item.filePath) {
      return NextResponse.json(
        { error: "File path not found in database" },
        { status: 404 },
      );
    }

    // For preview mode, return presigned URL for direct access
    if (preview && !download) {
      try {
        const downloadUrl = await fileProcessor.generateDownloadUrl(
          item.filePath,
          3600, // 1 hour expiry
        );

        return NextResponse.json({
          url: downloadUrl,
          fileName: item.name,
          mimeType: item.mimeType,
          size: item.sizeBytes,
          expiresIn: 3600,
        });
      } catch (error) {
        console.error("Error generating download URL:", error);
        return NextResponse.json(
          { error: "Failed to generate download URL" },
          { status: 500 },
        );
      }
    }

    // For direct download, stream the file through the API
    if (download) {
      try {
        // For large files, use streaming
        if (item.sizeBytes > 10 * 1024 * 1024) {
          // 10MB threshold
          const stream = await fileProcessor.downloadFileStream(item.filePath);

          return new Response(stream, {
            headers: {
              "Content-Type": item.mimeType || "application/octet-stream",
              "Content-Disposition": `attachment; filename="${item.name}"`,
              "Content-Length": item.sizeBytes.toString(),
              "Cache-Control": "private, max-age=3600",
            },
          });
        } else {
          // For smaller files, download as buffer
          const fileBuffer = await fileProcessor.downloadFile(item.filePath);

          return new Response(fileBuffer as BodyInit, {
            headers: {
              "Content-Type": item.mimeType || "application/octet-stream",
              "Content-Disposition": `attachment; filename="${item.name}"`,
              "Content-Length": fileBuffer.length.toString(),
              "Cache-Control": "private, max-age=3600",
            },
          });
        }
      } catch (error) {
        console.error("Error downloading file:", error);
        return NextResponse.json(
          { error: "Failed to download file from storage" },
          { status: 500 },
        );
      }
    }

    // Default: return file metadata
    return NextResponse.json({
      item: formatItemForFrontend(item),
    });
  } catch (error) {
    console.error("Error in item GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/items/[id] - Update item (rename, move)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const body = await request.json();
    const { name, parentId } = body;
    const { id } = await params;

    // Get the item to update
    const [existingItem] = await db
      .select()
      .from(items)
      .where(and(eq(items.id, id), eq(items.userId, user.id)))
      .limit(1);

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Update the item
    const updateData: Partial<typeof items.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      updateData.name = name;
    }

    if (parentId !== undefined) {
      updateData.parentId = parentId;
    }

    const [updatedItem] = await db
      .update(items)
      .set(updateData)
      .where(and(eq(items.id, id), eq(items.userId, user.id)))
      .returning();

    return NextResponse.json({
      item: formatItemForFrontend(updatedItem),
      message: "Item updated successfully",
    });
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/items/[id] - Delete item permanently
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const { id } = await params;

    // Get the item to delete
    const [existingItem] = await db
      .select()
      .from(items)
      .where(and(eq(items.id, id), eq(items.userId, user.id)))
      .limit(1);

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    let totalSizeFreed = 0;

    // Permanent deletion - remove from database AND S3
    if (existingItem.type === "folder") {
      // Get all descendants and calculate total size
      const descendants = await getAllDescendants(id, user.id);
      const fileDescendants = descendants.filter(
        (item) => item.type === "file",
      );

      totalSizeFreed = fileDescendants.reduce(
        (sum, item) => sum + item.sizeBytes,
        0,
      );

      // Batch delete all descendant files from S3 (OPTIMIZED)
      const filePaths = fileDescendants
        .map((item) => item.filePath)
        .filter(Boolean) as string[];

      if (filePaths.length > 0) {
        try {
          const s3Result = await fileProcessor.deleteFiles(filePaths);

          // Log any S3 deletion errors but continue with DB cleanup
          if (s3Result.errors.length > 0) {
            console.error(
              `Failed to delete ${s3Result.errors.length} files from S3:`,
              s3Result.errors,
            );
          }

          console.log(
            `Successfully deleted ${s3Result.deleted.length} files from S3`,
          );
        } catch (error) {
          console.error("Batch S3 deletion failed:", error);
          // Continue with database deletion even if S3 deletion fails
        }
      }

      // Bulk delete all descendants from database (OPTIMIZED)
      if (descendants.length > 0) {
        const descendantIds = descendants.map((d) => d.id);
        await db.delete(items).where(inArray(items.id, descendantIds));
      }
    } else if (existingItem.type === "file") {
      // Delete single file from S3 first
      if (existingItem.filePath) {
        try {
          await fileProcessor.deleteFile(existingItem.filePath);
        } catch (error) {
          console.error(
            `Failed to delete file from S3: ${existingItem.filePath}`,
            error,
          );
          // Continue with database deletion even if S3 deletion fails
        }
      }
      totalSizeFreed = existingItem.sizeBytes;
    }

    // Delete the item itself from database
    await db.delete(items).where(eq(items.id, id));

    // Update user's storage if any files were deleted
    if (totalSizeFreed > 0) {
      await db
        .update(users)
        .set({ storageUsed: Math.max(0, user.storageUsed - totalSizeFreed) })
        .where(eq(users.id, user.id));
    }

    return NextResponse.json({
      message: "Item deleted successfully",
      sizeFreed: totalSizeFreed,
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
