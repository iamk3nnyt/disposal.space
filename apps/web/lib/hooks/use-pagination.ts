"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

interface PaginationConfig {
  itemsPerPage?: number;
  totalItems: number;
}

interface PaginationResult {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  getPageItems: <T>(items: T[]) => T[];
}

export function usePagination({
  itemsPerPage = 10,
  totalItems,
}: PaginationConfig): PaginationResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get current page from URL params
  const currentPage = useMemo(() => {
    const page = searchParams.get("page");
    const pageNum = page ? parseInt(page, 10) : 1;
    return pageNum > 0 ? pageNum : 1;
  }, [searchParams]);

  // Calculate pagination values
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Navigation functions
  const updatePage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());

      if (page <= 1) {
        params.delete("page");
      } else {
        params.set("page", page.toString());
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      router.push(newUrl);
    },
    [pathname, router, searchParams],
  );

  const goToPage = useCallback(
    (page: number) => {
      const clampedPage = Math.max(1, Math.min(page, totalPages));
      updatePage(clampedPage);
    },
    [totalPages, updatePage],
  );

  const goToNextPage = useCallback(() => {
    if (validCurrentPage < totalPages) {
      updatePage(validCurrentPage + 1);
    }
  }, [validCurrentPage, totalPages, updatePage]);

  const goToPreviousPage = useCallback(() => {
    if (validCurrentPage > 1) {
      updatePage(validCurrentPage - 1);
    }
  }, [validCurrentPage, updatePage]);

  // Helper function to get paginated items
  const getPageItems = useCallback(
    <T>(items: T[]): T[] => {
      return items.slice(startIndex, endIndex);
    },
    [startIndex, endIndex],
  );

  return {
    currentPage: validCurrentPage,
    totalPages,
    itemsPerPage,
    startIndex,
    endIndex,
    hasNextPage: validCurrentPage < totalPages,
    hasPreviousPage: validCurrentPage > 1,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    getPageItems,
  };
}
