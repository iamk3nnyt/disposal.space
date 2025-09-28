import { db, items } from "@ketryon/database";
import { and, eq, isNull } from "drizzle-orm";

export interface FolderPathResult {
  folderId: string | null;
  folderName: string;
  path: Array<{ id: string; name: string }>;
  pathSegments: string[];
  created?: string[]; // IDs of newly created folders (only when createMissing = true)
}

export interface PathResolverOptions {
  createMissing?: boolean; // true for uploads, false for navigation
  rootParentId?: string | null; // starting parent (default: null for root)
}

/**
 * Unified folder path resolver that can both navigate to existing folders
 * and create missing folders during upload operations.
 *
 * @param pathSegments - Array of folder names to traverse
 * @param userId - User ID for security
 * @param options - Configuration options
 * @returns Resolved folder information
 */
export async function resolveFolderPath(
  pathSegments: string[],
  userId: string,
  options: PathResolverOptions = {},
): Promise<FolderPathResult> {
  const { createMissing = false, rootParentId = null } = options;

  // Handle empty path (root folder)
  if (pathSegments.length === 0) {
    return {
      folderId: rootParentId,
      folderName: rootParentId ? "Folder" : "Dashboard",
      path: [],
      pathSegments: [],
      ...(createMissing && { created: [] }),
    };
  }

  // Track traversal state
  let currentParentId = rootParentId;
  let currentFolderName = rootParentId ? "Folder" : "Dashboard";
  const resolvedPath: Array<{ id: string; name: string }> = [];
  const createdFolders: string[] = [];
  const createdFoldersCache = new Map<string, string>(); // For upload deduplication

  // Traverse each path segment
  for (const folderName of pathSegments) {
    // Build current path for caching (only used when createMissing = true)
    const currentPath = resolvedPath
      .map((p) => p.name)
      .concat(folderName)
      .join("/");

    // Check cache first (for upload operations)
    if (createMissing && createdFoldersCache.has(currentPath)) {
      currentParentId = createdFoldersCache.get(currentPath)!;
      currentFolderName = folderName;
      resolvedPath.push({ id: currentParentId, name: folderName });
      continue;
    }

    // Find existing folder
    const [existingFolder] = await db
      .select()
      .from(items)
      .where(
        and(
          eq(items.userId, userId),
          currentParentId
            ? eq(items.parentId, currentParentId)
            : isNull(items.parentId),
          eq(items.name, folderName),
          eq(items.type, "folder"),
          eq(items.isDeleted, false),
        ),
      )
      .limit(1);

    if (existingFolder) {
      // Folder exists - use it
      currentParentId = existingFolder.id;
      currentFolderName = existingFolder.name;
      resolvedPath.push({ id: existingFolder.id, name: existingFolder.name });

      // Cache for future lookups (upload operations)
      if (createMissing) {
        createdFoldersCache.set(currentPath, existingFolder.id);
      }
    } else if (createMissing) {
      // Folder doesn't exist - create it (upload mode)
      const [newFolder] = await db
        .insert(items)
        .values({
          userId,
          parentId: currentParentId,
          name: folderName,
          type: "folder",
          sizeBytes: 0,
        })
        .returning();

      currentParentId = newFolder.id;
      currentFolderName = newFolder.name;
      resolvedPath.push({ id: newFolder.id, name: newFolder.name });
      createdFolders.push(newFolder.id);
      createdFoldersCache.set(currentPath, newFolder.id);
    } else {
      // Folder doesn't exist - return error (navigation mode)
      throw new Error(
        `Folder "${folderName}" not found in path: ${pathSegments
          .slice(0, pathSegments.indexOf(folderName) + 1)
          .join("/")}`,
      );
    }
  }

  return {
    folderId: currentParentId,
    folderName: currentFolderName,
    path: resolvedPath,
    pathSegments,
    ...(createMissing && { created: createdFolders }),
  };
}

/**
 * Specialized function for navigation - throws error if path doesn't exist
 */
export async function navigateToFolder(
  pathSegments: string[],
  userId: string,
  rootParentId?: string | null,
): Promise<FolderPathResult> {
  return resolveFolderPath(pathSegments, userId, {
    createMissing: false,
    rootParentId,
  });
}

/**
 * Specialized function for uploads - creates missing folders
 */
export async function createFolderHierarchy(
  pathSegments: string[],
  userId: string,
  rootParentId?: string | null,
): Promise<FolderPathResult> {
  return resolveFolderPath(pathSegments, userId, {
    createMissing: true,
    rootParentId,
  });
}
