"use client";

import { useCallback, useState } from "react";

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  item: {
    id: string;
    name: string;
    isFolder: boolean;
    type: string;
    isPublic: boolean;
  } | null;
}

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    item: null,
  });

  const openContextMenu = useCallback(
    (
      event: React.MouseEvent,
      item: {
        id: string;
        name: string;
        isFolder: boolean;
        type: string;
        isPublic: boolean;
      },
    ) => {
      event.preventDefault();
      event.stopPropagation();

      setContextMenu({
        isOpen: true,
        x: event.clientX,
        y: event.clientY,
        item,
      });
    },
    [],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu({
      isOpen: false,
      x: 0,
      y: 0,
      item: null,
    });
  }, []);

  const handleRowClick = useCallback(
    (
      event: React.MouseEvent,
      item: {
        id: string;
        name: string;
        isFolder: boolean;
        type: string;
        isPublic: boolean;
      },
    ) => {
      // Left click opens context menu
      if (event.button === 0) {
        openContextMenu(event, item);
      }
    },
    [openContextMenu],
  );

  const handleRowContextMenu = useCallback(
    (
      event: React.MouseEvent,
      item: {
        id: string;
        name: string;
        isFolder: boolean;
        type: string;
        isPublic: boolean;
      },
    ) => {
      // Right click opens context menu
      openContextMenu(event, item);
    },
    [openContextMenu],
  );

  return {
    contextMenu,
    openContextMenu,
    closeContextMenu,
    handleRowClick,
    handleRowContextMenu,
  };
}
