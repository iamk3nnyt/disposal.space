import { formatItemForFrontend } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { db, items, users } from "@ketryon/database";
import { and, desc, eq, ilike } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// Helper function to get item path (breadcrumb)
async function getItemPath(itemId: string, userId: string): Promise<string[]> {
  const path: string[] = [];
  let currentId: string | null = itemId;

  while (currentId) {
    const [item] = await db
      .select()
      .from(items)
      .where(and(eq(items.id, currentId), eq(items.userId, userId)))
      .limit(1);

    if (!item) break;

    path.unshift(item.name);
    currentId = item.parentId;
  }

  return path;
}

// GET /api/items/search - Search user's items
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
    const query = searchParams.get("q");
    const type = searchParams.get("type"); // 'file', 'folder', or null for both
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build search conditions
    const conditions = [eq(items.userId, user.id), eq(items.isDeleted, false)];

    // If query is provided, add search filters
    if (query && query.trim().length > 0) {
      const trimmedQuery = query.trim();
      conditions.push(ilike(items.name, `%${trimmedQuery}%`));
    }

    if (type) {
      conditions.push(eq(items.type, type));
    }

    // Order by relevance if searching, by recent activity if browsing
    const hasSearchQuery = query && query.trim().length > 0;
    const orderBy = hasSearchQuery
      ? [items.name, items.updatedAt]
      : [desc(items.updatedAt)];

    const searchResults = await db
      .select()
      .from(items)
      .where(and(...conditions))
      .orderBy(...orderBy)
      .limit(limit);

    // Format results and add path information
    const formattedResults = await Promise.all(
      searchResults.map(async (item) => {
        const path = await getItemPath(item.parentId || "", user.id);
        return {
          ...formatItemForFrontend(item),
          path: path.length > 0 ? path.join(" > ") : "Root",
        };
      }),
    );

    return NextResponse.json({
      items: formattedResults,
      totalCount: formattedResults.length,
      query,
    });
  } catch (error) {
    console.error("Error searching items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
