"use client";

import type { UploadProgress } from "@/lib/hooks/use-item-operations";
import { createContext, ReactNode, useContext, useState } from "react";

interface UploadProgressContextType {
  uploadingFiles: UploadProgress[];
  setUploadingFiles: (files: UploadProgress[]) => void;
  clearUploadProgress: () => void;
}

const UploadProgressContext = createContext<
  UploadProgressContextType | undefined
>(undefined);

export function UploadProgressProvider({ children }: { children: ReactNode }) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadProgress[]>([]);

  const clearUploadProgress = () => {
    setUploadingFiles([]);
  };

  return (
    <UploadProgressContext.Provider
      value={{
        uploadingFiles,
        setUploadingFiles,
        clearUploadProgress,
      }}
    >
      {children}
    </UploadProgressContext.Provider>
  );
}

export function useUploadProgress() {
  const context = useContext(UploadProgressContext);
  if (context === undefined) {
    throw new Error(
      "useUploadProgress must be used within an UploadProgressProvider",
    );
  }
  return context;
}
