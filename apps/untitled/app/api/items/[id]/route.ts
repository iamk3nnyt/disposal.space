import { formatItemForFrontend } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { fileProcessor } from "@ketryon/aws";
import { db, items, users } from "@ketryon/database";
import { and, eq } from "drizzle-orm";
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

// DELETE /api/items/[id] - Delete item (soft delete)
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
    const searchParams = request.nextUrl.searchParams;
    const permanent = searchParams.get("permanent") === "true";
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

    if (permanent) {
      // Permanent deletion - remove from database AND S3
      if (existingItem.type === "folder") {
        // Get all descendants and calculate total size
        const descendants = await getAllDescendants(id, user.id);
        totalSizeFreed = descendants
          .filter((item) => item.type === "file")
          .reduce((sum, item) => sum + item.sizeBytes, 0);

        // Delete all descendant files from S3 first
        for (const descendant of descendants) {
          if (descendant.type === "file" && descendant.filePath) {
            try {
              await fileProcessor.deleteFile(descendant.filePath);
            } catch (error) {
              console.error(
                `Failed to delete file from S3: ${descendant.filePath}`,
                error,
              );
              // Continue with database deletion even if S3 deletion fails
            }
          }
        }

        // Delete all descendants from database
        for (const descendant of descendants) {
          await db.delete(items).where(eq(items.id, descendant.id));
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
    } else {
      // Soft delete - mark as deleted
      if (existingItem.type === "folder") {
        // Get all descendants and mark them as deleted
        const descendants = await getAllDescendants(id, user.id);

        for (const descendant of descendants) {
          await db
            .update(items)
            .set({ isDeleted: true, deletedAt: new Date() })
            .where(eq(items.id, descendant.id));
        }
      }

      // Mark the item itself as deleted
      await db
        .update(items)
        .set({ isDeleted: true, deletedAt: new Date() })
        .where(eq(items.id, id));
    }

    // Update user's storage if any files were deleted
    if (totalSizeFreed > 0) {
      await db
        .update(users)
        .set({ storageUsed: Math.max(0, user.storageUsed - totalSizeFreed) })
        .where(eq(users.id, user.id));
    }

    return NextResponse.json({
      message: `Item ${permanent ? "permanently deleted" : "moved to trash"} successfully`,
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
