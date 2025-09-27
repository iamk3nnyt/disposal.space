import { type SelectItem } from "@ketryon/database";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Helper function to format date
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

// Helper function to convert database item to frontend format
export function formatItemForFrontend(item: SelectItem) {
  return {
    id: item.id,
    name: item.name,
    type: item.type === "folder" ? "folder" : item.fileType || "FILE",
    size: item.type === "folder" ? "" : formatFileSize(item.sizeBytes),
    lastModified: formatDate(item.updatedAt),
    isFolder: item.type === "folder",
    sizeBytes: item.sizeBytes,
  };
}
