import { formatItemForFrontend } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
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
      // Permanent deletion - remove from database
      if (existingItem.type === "folder") {
        // Get all descendants and calculate total size
        const descendants = await getAllDescendants(id, user.id);
        totalSizeFreed = descendants
          .filter((item) => item.type === "file")
          .reduce((sum, item) => sum + item.sizeBytes, 0);

        // Delete all descendants
        for (const descendant of descendants) {
          await db.delete(items).where(eq(items.id, descendant.id));
        }
      } else {
        totalSizeFreed = existingItem.sizeBytes;
      }

      // Delete the item itself
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
