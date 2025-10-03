import { formatItemForFrontend } from "@/lib/utils";
import { db, items } from "@ketryon/database";
import { and, count, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/public/folders/[id] - Get public folder contents with pagination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Get pagination parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    // First, verify the folder exists and is public
    const [folder] = await db
      .select()
      .from(items)
      .where(
        and(
          eq(items.id, id),
          eq(items.type, "folder"),
          eq(items.isPublic, true),
          eq(items.isDeleted, false),
        ),
      )
      .limit(1);

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found or not publicly accessible" },
        { status: 404 },
      );
    }

    // Get total count of public children
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(items)
      .where(
        and(
          eq(items.parentId, id),
          eq(items.isPublic, true),
          eq(items.isDeleted, false),
        ),
      );

    // Get paginated public children of this folder
    const children = await db
      .select()
      .from(items)
      .where(
        and(
          eq(items.parentId, id),
          eq(items.isPublic, true),
          eq(items.isDeleted, false),
        ),
      )
      .orderBy(items.type, items.name)
      .limit(limit)
      .offset(offset);

    const formattedChildren = children.map(formatItemForFrontend);

    return NextResponse.json({
      folder: formatItemForFrontend(folder),
      children: formattedChildren,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: offset + children.length < totalCount,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error in public folder API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
