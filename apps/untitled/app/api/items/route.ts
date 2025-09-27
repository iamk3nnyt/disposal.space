import { formatFileSize, formatItemForFrontend } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { db, items, users } from "@ketryon/database";
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

// POST /api/items - Create new item (file or folder)
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

    const body = await request.json();

    const { name, type, parentId, fileType, sizeBytes = 0, mimeType } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 },
      );
    }

    // Check storage limit for files
    if (type === "file" && sizeBytes > 0) {
      if (user.storageUsed + sizeBytes > user.storageLimit) {
        return NextResponse.json(
          { error: "Storage limit exceeded" },
          { status: 400 },
        );
      }
    }

    // Create the item
    const [newItem] = await db
      .insert(items)
      .values({
        userId: user.id,
        parentId: parentId || null,
        name,
        type,
        fileType: type === "file" ? fileType : null,
        sizeBytes,
        mimeType: type === "file" ? mimeType : null,
      })
      .returning();

    // Update user's storage if it's a file
    if (type === "file" && sizeBytes > 0) {
      await db
        .update(users)
        .set({ storageUsed: user.storageUsed + sizeBytes })
        .where(eq(users.id, user.id));
    }

    return NextResponse.json({
      item: formatItemForFrontend(newItem),
      message: `${type === "folder" ? "Folder" : "File"} created successfully`,
    });
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
