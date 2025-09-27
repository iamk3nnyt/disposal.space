import { useQuery } from "@tanstack/react-query";

interface FolderPathResponse {
  folderId: string | null;
  folderName: string;
  path: { id: string; name: string }[];
  pathSegments: string[];
}

async function resolveFolderPath(
  pathSegments: string[],
): Promise<FolderPathResponse> {
  const pathParam = pathSegments.join("/");
  const params = new URLSearchParams();
  if (pathParam) {
    params.append("path", pathParam);
  }

  const response = await fetch(
    `/api/folders/resolve-path?${params.toString()}`,
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to resolve folder path");
  }

  return response.json();
}

export function useFolderPath(pathSegments: string[]) {
  return useQuery<FolderPathResponse, Error>({
    queryKey: ["folderPath", pathSegments],
    queryFn: () => resolveFolderPath(pathSegments),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
