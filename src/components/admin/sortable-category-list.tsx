"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface Tag {
  id: string;
  slug: string;
  label: string;
  is_blocked: boolean;
  is_active: boolean;
}

function SortableRow({ tag }: { tag: Tag }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tag.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : undefined,
        position: "relative",
      }}
      className="flex items-center justify-between px-4 py-2.5 gap-4 bg-background"
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none shrink-0"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </button>
        <span className="font-medium">{tag.label}</span>
        <span className="text-xs text-muted-foreground font-mono">{tag.slug}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0 text-xs">
        {tag.is_blocked && (
          <span className="text-destructive font-medium">blocked</span>
        )}
        <span className={tag.is_active ? "text-muted-foreground" : "text-muted-foreground opacity-50"}>
          {tag.is_active ? "active" : "inactive"}
        </span>
      </div>
    </div>
  );
}

export function SortableCategoryList({ initialTags }: { initialTags: Tag[] }) {
  const [tags, setTags] = useState(initialTags);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTags((prev) => {
        const oldIndex = prev.findIndex((t) => t.id === active.id);
        const newIndex = prev.findIndex((t) => t.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
      setDirty(true);
      setSaved(false);
      setError(null);
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/tags/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: tags.map((t) => t.id) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Failed to save order.");
      } else {
        setSaved(true);
        setDirty(false);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="divide-y border rounded-md overflow-hidden text-sm">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={tags.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tags.map((tag) => (
              <SortableRow key={tag.id} tag={tag} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="text-sm px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving…" : "Save order"}
        </button>
        {saved && !dirty && (
          <span className="text-xs text-muted-foreground">Order saved.</span>
        )}
        {error && (
          <span className="text-xs text-destructive">{error}</span>
        )}
        {dirty && (
          <span className="text-xs text-muted-foreground">Unsaved changes.</span>
        )}
      </div>
    </div>
  );
}
