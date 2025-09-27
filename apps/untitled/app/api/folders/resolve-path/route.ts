import { auth } from "@clerk/nextjs/server";
import { db, items, users } from "@ketryon/database";
import { and, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/folders/resolve-path - Resolve folder path to folder ID
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
    const pathParam = searchParams.get("path");

    if (!pathParam) {
      // Root folder - return null as parentId
      return NextResponse.json({
        folderId: null,
        folderName: "Dashboard",
        path: [],
      });
    }

    // Split path into segments and decode them
    const pathSegments = pathParam
      .split("/")
      .filter((segment) => segment.length > 0)
      .map(decodeURIComponent);

    if (pathSegments.length === 0) {
      return NextResponse.json({
        folderId: null,
        folderName: "Dashboard",
        path: [],
      });
    }

    // Traverse the folder path
    let currentParentId: string | null = null;
    let currentFolderName = "Dashboard";
    const resolvedPath: { id: string; name: string }[] = [];

    for (const folderName of pathSegments) {
      // Find folder with this name under current parent
      const [folder] = await db
        .select()
        .from(items)
        .where(
          and(
            eq(items.userId, user.id),
            currentParentId
              ? eq(items.parentId, currentParentId)
              : isNull(items.parentId),
            eq(items.name, folderName),
            eq(items.type, "folder"),
            eq(items.isDeleted, false),
          ),
        )
        .limit(1);

      if (!folder) {
        return NextResponse.json(
          {
            error: `Folder "${folderName}" not found in path`,
            invalidPath: pathSegments
              .slice(0, pathSegments.indexOf(folderName) + 1)
              .join("/"),
          },
          { status: 404 },
        );
      }

      currentParentId = folder.id;
      currentFolderName = folder.name;
      resolvedPath.push({ id: folder.id, name: folder.name });
    }

    return NextResponse.json({
      folderId: currentParentId,
      folderName: currentFolderName,
      path: resolvedPath,
      pathSegments,
    });
  } catch (error) {
    console.error("Error resolving folder path:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
