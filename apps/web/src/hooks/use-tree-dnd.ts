import { useState } from "react";

export type DraggedItem = {
  id: string;
  type: "folder" | "note";
  name: string;
};

export function useTreeDnD() {
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const startDrag = (item: DraggedItem) => {
    setDraggedItem(item);
  };

  const endDrag = () => {
    setDraggedItem(null);
    setDropTarget(null);
  };

  const setDragOver = (targetId: string | null) => {
    setDropTarget(targetId);
  };

  return {
    draggedItem,
    dropTarget,
    startDrag,
    endDrag,
    setDragOver,
    isDragging: !!draggedItem,
  };
}
