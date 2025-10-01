"use client";

import { useQuery } from "@tanstack/react-query";

// Types
export interface SearchResult {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  isFolder: boolean;
  sizeBytes: number;
  path: string; // Breadcrumb path
  pathSegments: string[]; // Raw path segments for navigation
  parentId: string | null; // Parent folder ID for navigation
}

export interface SearchResponse {
  items: SearchResult[];
  totalCount: number;
  query: string;
}

// API function
async function searchItems(
  query: string,
  type?: "file" | "folder",
  limit = 20,
): Promise<SearchResponse> {
  const params = new URLSearchParams();
  params.append("q", query);
  if (type) {
    params.append("type", type);
  }
  params.append("limit", limit.toString());

  const response = await fetch(`/api/items/search?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to search items: ${response.statusText}`);
  }

  return response.json();
}

// React Query hook
export function useSearch(query: string, type?: "file" | "folder", limit = 20) {
  return useQuery({
    queryKey: ["search", query, type, limit],
    queryFn: () => searchItems(query, type, limit),
    staleTime: 30 * 1000, // 30 seconds
  });
}
