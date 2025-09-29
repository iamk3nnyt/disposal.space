// Shared types for the mobile app
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  isFolder: boolean;
  sizeBytes: number;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  size: string;
  status: "uploading" | "processing" | "completed" | "error";
  error?: string;
  isFolder?: boolean;
  fileCount?: {
    total: number;
    processed: number;
  };
}
