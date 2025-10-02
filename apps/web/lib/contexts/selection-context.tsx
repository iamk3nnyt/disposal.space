"use client";

import { createContext, ReactNode, useContext, useState } from "react";

interface SelectionContextType {
  selectedFiles: string[];
  setSelectedFiles: (files: string[] | ((prev: string[]) => string[])) => void;
  clearSelection: () => void;
  toggleFileSelection: (fileId: string) => void;
  toggleSelectAll: (allFileIds: string[]) => void;
  isAllSelected: (allFileIds: string[]) => boolean;
  isIndeterminate: (allFileIds: string[]) => boolean;
}

const SelectionContext = createContext<SelectionContextType | undefined>(
  undefined,
);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  const clearSelection = () => setSelectedFiles([]);

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  const toggleSelectAll = (allFileIds: string[]) => {
    if (selectedFiles.length === allFileIds.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(allFileIds);
    }
  };

  const isAllSelected = (allFileIds: string[]) =>
    selectedFiles.length === allFileIds.length && allFileIds.length > 0;

  const isIndeterminate = (allFileIds: string[]) =>
    selectedFiles.length > 0 && selectedFiles.length < allFileIds.length;

  return (
    <SelectionContext.Provider
      value={{
        selectedFiles,
        setSelectedFiles,
        clearSelection,
        toggleFileSelection,
        toggleSelectAll,
        isAllSelected,
        isIndeterminate,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
}
