"use client";

import { createContext, ReactNode, useContext, useState } from "react";

export interface FileProcessingProgress {
  isProcessing: boolean;
  processedFiles: number;
  totalFiles: number;
  currentFile: string;
}

interface FileProcessingContextType {
  // Layout processing progress (for dropdown uploads)
  layoutProcessingProgress: FileProcessingProgress;
  setLayoutProcessingProgress: (progress: FileProcessingProgress) => void;
  updateLayoutProcessingProgress: (
    updates: Partial<FileProcessingProgress>,
  ) => void;

  // Page processing progress (for drag-and-drop)
  pageProcessingProgress: FileProcessingProgress;
  setPageProcessingProgress: (progress: FileProcessingProgress) => void;
  updatePageProcessingProgress: (
    updates: Partial<FileProcessingProgress>,
  ) => void;

  // Clear functions
  clearLayoutProcessing: () => void;
  clearPageProcessing: () => void;
}

const FileProcessingContext = createContext<
  FileProcessingContextType | undefined
>(undefined);

const initialProgress: FileProcessingProgress = {
  isProcessing: false,
  processedFiles: 0,
  totalFiles: 0,
  currentFile: "",
};

export function FileProcessingProvider({ children }: { children: ReactNode }) {
  const [layoutProcessingProgress, setLayoutProcessingProgress] =
    useState<FileProcessingProgress>(initialProgress);
  const [pageProcessingProgress, setPageProcessingProgress] =
    useState<FileProcessingProgress>(initialProgress);

  const updateLayoutProcessingProgress = (
    updates: Partial<FileProcessingProgress>,
  ) => {
    setLayoutProcessingProgress((prev) => ({ ...prev, ...updates }));
  };

  const updatePageProcessingProgress = (
    updates: Partial<FileProcessingProgress>,
  ) => {
    setPageProcessingProgress((prev) => ({ ...prev, ...updates }));
  };

  const clearLayoutProcessing = () => {
    setLayoutProcessingProgress(initialProgress);
  };

  const clearPageProcessing = () => {
    setPageProcessingProgress(initialProgress);
  };

  return (
    <FileProcessingContext.Provider
      value={{
        layoutProcessingProgress,
        setLayoutProcessingProgress,
        updateLayoutProcessingProgress,
        pageProcessingProgress,
        setPageProcessingProgress,
        updatePageProcessingProgress,
        clearLayoutProcessing,
        clearPageProcessing,
      }}
    >
      {children}
    </FileProcessingContext.Provider>
  );
}

export function useFileProcessing() {
  const context = useContext(FileProcessingContext);
  if (context === undefined) {
    throw new Error(
      "useFileProcessing must be used within a FileProcessingProvider",
    );
  }
  return context;
}
