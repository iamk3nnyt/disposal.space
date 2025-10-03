import { formatFileSize } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { db, items, users } from "@ketryon/database";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET /api/user/storage - Get user storage information
export async function GET() {
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

    // Get actual storage usage from database (in case it's out of sync)
    const [storageResult] = await db
      .select({
        totalSize: sql<number>`COALESCE(SUM(${items.sizeBytes}), 0)`,
        fileCount: sql<number>`COUNT(CASE WHEN ${items.type} = 'file' AND ${items.isDeleted} = false THEN 1 END)`,
        folderCount: sql<number>`COUNT(CASE WHEN ${items.type} = 'folder' AND ${items.isDeleted} = false THEN 1 END)`,
        deletedCount: sql<number>`COUNT(CASE WHEN ${items.isDeleted} = true THEN 1 END)`,
      })
      .from(items)
      .where(eq(items.userId, user.id));

    const actualStorageUsed = Number(storageResult.totalSize);
    const fileCount = Number(storageResult.fileCount);
    const folderCount = Number(storageResult.folderCount);
    const deletedCount = Number(storageResult.deletedCount);

    // Update user's storage if it's out of sync
    if (actualStorageUsed !== user.storageUsed) {
      await db
        .update(users)
        .set({ storageUsed: actualStorageUsed })
        .where(eq(users.id, user.id));
    }

    const storageUsedPercentage = Math.round(
      (actualStorageUsed / user.storageLimit) * 100,
    );

    return NextResponse.json({
      user: {
        id: user.id,
        clerkUserId: user.clerkUserId,
        email: user.email,
        name: user.name,
        membership: user.membership,
        storageUsed: actualStorageUsed,
        storageLimit: user.storageLimit,
        storageUsedFormatted: formatFileSize(actualStorageUsed),
        storageLimitFormatted: formatFileSize(user.storageLimit),
        storageUsedPercentage,
        storageAvailable: user.storageLimit - actualStorageUsed,
        storageAvailableFormatted: formatFileSize(
          user.storageLimit - actualStorageUsed,
        ),
      },
      stats: {
        totalItems: fileCount + folderCount,
        fileCount,
        folderCount,
        deletedCount,
      },
    });
  } catch (error) {
    console.error("Error fetching user storage:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
