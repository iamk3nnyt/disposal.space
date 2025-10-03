import { formatItemForFrontend } from "@/lib/utils";
import { generateDownloadUrl } from "@ketryon/aws";
import { db, items } from "@ketryon/database";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/public/items/[id] - Get public item metadata or download
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const download = searchParams.get("download") === "true";

    // Get the item from database - only public items
    const [item] = await db
      .select()
      .from(items)
      .where(
        and(
          eq(items.id, id),
          eq(items.isPublic, true),
          eq(items.isDeleted, false),
        ),
      )
      .limit(1);

    if (!item) {
      return NextResponse.json(
        { error: "Item not found or not publicly accessible" },
        { status: 404 },
      );
    }

    // Handle folder requests - return metadata only
    if (item.type === "folder") {
      if (download) {
        return NextResponse.json(
          { error: "Cannot download folders directly" },
          { status: 400 },
        );
      }

      return NextResponse.json({
        item: formatItemForFrontend(item),
      });
    }

    // Handle file requests
    if (!item.filePath) {
      return NextResponse.json(
        { error: "File path not found" },
        { status: 404 },
      );
    }

    // For download requests, generate presigned URL
    if (download) {
      try {
        const downloadUrl = await generateDownloadUrl(item.filePath, 3600); // 1 hour expiry
        return NextResponse.json({
          downloadUrl,
          item: formatItemForFrontend(item),
        });
      } catch (error) {
        console.error("Error generating download URL:", error);
        return NextResponse.json(
          { error: "Failed to generate download URL" },
          { status: 500 },
        );
      }
    }

    // Return file metadata for preview
    return NextResponse.json({
      item: formatItemForFrontend(item),
    });
  } catch (error) {
    console.error("Error in public item API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
