"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  onNextPage,
  onPreviousPage,
  totalItems,
  startIndex,
  endIndex,
  className,
}: PaginationProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5; // Number of page buttons to show

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small (no ellipsis needed)
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Determine if we need left ellipsis
      if (currentPage > Math.floor(maxVisiblePages / 2) + 1) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(
        2,
        currentPage - Math.floor(maxVisiblePages / 2) + 1,
      );
      const end = Math.min(
        totalPages - 1,
        currentPage + Math.floor(maxVisiblePages / 2) - 1,
      );

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Determine if we need right ellipsis
      if (currentPage < totalPages - Math.floor(maxVisiblePages / 2)) {
        pages.push("...");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }

      // Filter out consecutive ellipses
      return pages.filter((page, index, arr) => {
        return !(page === "..." && arr[index - 1] === "...");
      });
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={cn(
        "sticky bottom-0 flex min-h-22 w-full items-center justify-between border-t border-gray-100 bg-white px-4 py-3 sm:px-6",
        className,
      )}
    >
      {/* Mobile pagination info */}
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={onPreviousPage}
          disabled={!hasPreviousPage}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={onNextPage}
          disabled={!hasNextPage}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Desktop pagination */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
            <span className="font-medium">{endIndex}</span> of{" "}
            <span className="font-medium">{totalItems}</span> results
          </p>
        </div>
        <div>
          <nav
            className="isolate inline-flex -space-x-px rounded-md"
            aria-label="Pagination"
          >
            {/* Previous button */}
            <button
              onClick={onPreviousPage}
              disabled={!hasPreviousPage}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Page numbers */}
            {pageNumbers.map((pageNum, index) =>
              pageNum === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-300 ring-inset focus:outline-offset-0"
                >
                  ...
                </span>
              ) : (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum as number)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-gray-300 ring-inset focus:z-20 focus:outline-offset-0 ${
                    pageNum === currentPage
                      ? "z-10 bg-green-600 text-white ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                      : "text-gray-900 ring-1 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              ),
            )}

            {/* Next button */}
            <button
              onClick={onNextPage}
              disabled={!hasNextPage}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
