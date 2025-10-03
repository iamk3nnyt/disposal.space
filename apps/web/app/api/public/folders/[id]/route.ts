import { formatItemForFrontend } from "@/lib/utils";
import { db, items } from "@ketryon/database";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/public/folders/[id] - Get public folder contents
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

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

    // Get all public children of this folder
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
      .orderBy(items.type, items.name);

    const formattedChildren = children.map(formatItemForFrontend);

    return NextResponse.json({
      folder: formatItemForFrontend(folder),
      children: formattedChildren,
    });
  } catch (error) {
    console.error("Error in public folder API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
