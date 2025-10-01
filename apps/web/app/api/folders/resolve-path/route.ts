import { navigateToFolder } from "@/lib/folder-traversal";
import { auth } from "@clerk/nextjs/server";
import { db, users } from "@ketryon/database";
import { eq } from "drizzle-orm";
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

    // Parse path segments
    const pathSegments = pathParam
      ? pathParam
          .split("/")
          .filter((segment) => segment.length > 0)
          .map(decodeURIComponent)
      : [];

    // Use unified path resolver
    try {
      const result = await navigateToFolder(pathSegments, user.id);

      return NextResponse.json({
        folderId: result.folderId,
        folderName: result.folderName,
        path: result.path,
        pathSegments: result.pathSegments,
      });
    } catch (error) {
      // Handle folder not found errors
      if (
        error instanceof Error &&
        error.message.includes("not found in path")
      ) {
        const errorMessage = error.message;
        const invalidPathMatch = errorMessage.match(/path: (.+)$/);
        const invalidPath = invalidPathMatch
          ? invalidPathMatch[1]
          : pathSegments.join("/");

        return NextResponse.json(
          {
            error: errorMessage,
            invalidPath,
          },
          { status: 404 },
        );
      }

      throw error; // Re-throw unexpected errors
    }
  } catch (error) {
    console.error("Error resolving folder path:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
