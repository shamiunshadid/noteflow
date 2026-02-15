"use client";

import React, { useState, useMemo } from "react";
import { useNoteFlowStore } from "@/store";
import { Note } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Plus,
  Search,
  Trash2,
  Edit3,
  FolderPlus,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";

interface TreeNodeProps {
  note: Note;
  notes: Note[];
  depth: number;
  onSelect: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onAddChild: (parentId: string, isFolder: boolean) => void;
  activeNoteId: string | null;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  note,
  notes,
  depth,
  onSelect,
  onRename,
  onDelete,
  onToggleExpand,
  onAddChild,
  activeNoteId,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const children = notes.filter((n) => n.parentId === note.id);
  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: note.id,
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `droppable-${note.id}`,
  });

  const setNodeRef = (el: HTMLElement | null) => {
    setDraggableRef(el);
    setDroppableRef(el);
  };

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== note.title) {
      onRename(note.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "select-none",
        isDragging && "opacity-50",
        isOver && "bg-accent/50"
      )}
      {...attributes}
      {...listeners}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              "group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
              activeNoteId === note.id
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted",
              isOver && "ring-2 ring-primary ring-offset-1"
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => {
              if (!isEditing) {
                onSelect(note.id);
                if (note.isFolder) onToggleExpand(note.id);
              }
            }}
          >
            {note.isFolder ? (
              <>
                {note.isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                {note.isExpanded ? (
                  <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Folder className="h-4 w-4 shrink-0 text-primary" />
                )}
              </>
            ) : (
              <>
                <span className="w-4 shrink-0" />
                <File className="h-4 w-4 shrink-0 text-muted-foreground" />
              </>
            )}
            
            {isEditing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") {
                    setEditTitle(note.title);
                    setIsEditing(false);
                  }
                }}
                className="h-6 text-sm px-1 py-0 flex-1"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-sm truncate flex-1">{note.title}</span>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => setIsEditing(true)}>
            <Edit3 className="h-4 w-4 mr-2" />
            Rename
          </ContextMenuItem>
          {note.isFolder && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => onAddChild(note.id, false)}>
                <File className="h-4 w-4 mr-2" />
                New Note
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onAddChild(note.id, true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </ContextMenuItem>
            </>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => onDelete(note.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {note.isFolder && note.isExpanded && children.length > 0 && (
        <div>
          {children
            .sort((a, b) => a.order - b.order)
            .map((child) => (
              <TreeNode
                key={child.id}
                note={child}
                notes={notes}
                depth={depth + 1}
                onSelect={onSelect}
                onRename={onRename}
                onDelete={onDelete}
                onToggleExpand={onToggleExpand}
                onAddChild={onAddChild}
                activeNoteId={activeNoteId}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export const DocumentTree: React.FC = () => {
  const {
    notes,
    activeNoteId,
    searchQuery,
    addNote,
    updateNote,
    deleteNote,
    setActiveNote,
    toggleFolderExpand,
    setSearchQuery,
    toggleLeftPanel,
  } = useNoteFlowStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  // Filter notes based on search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    
    const query = searchQuery.toLowerCase();
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    );
  }, [notes, searchQuery]);

  // Get root notes (no parent)
  const rootNotes = useMemo(() => {
    return filteredNotes
      .filter((note) => note.parentId === null)
      .sort((a, b) => a.order - b.order);
  }, [filteredNotes]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const draggedNote = notes.find((n) => n.id === active.id);
    if (!draggedNote) return;

    // Check if dropping on a folder
    const targetNote = notes.find((n) => n.id === over.id);
    if (targetNote?.isFolder) {
      updateNote(draggedNote.id, {
        parentId: targetNote.id,
        order: notes.filter((n) => n.parentId === targetNote.id).length,
      });
    } else if (over.id === "root") {
      // Drop at root level
      updateNote(draggedNote.id, {
        parentId: null,
        order: notes.filter((n) => n.parentId === null).length,
      });
    }
  };

  const handleAddNote = (isFolder: boolean, parentId: string | null = null) => {
    const title = isFolder ? "New Folder" : "New Note";
    addNote({
      title,
      content: "",
      parentId,
      isFolder,
      isExpanded: false,
    });
  };

  const handleRename = (id: string, newTitle: string) => {
    updateNote(id, { title: newTitle });
  };

  return (
    <div className="h-full flex flex-col bg-card border-r">
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm">Notes</h2>
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleAddNote(false)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Note</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleAddNote(true)}
                  >
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Folder</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Tree */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setActiveId(active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="flex-1 custom-scrollbar">
          <div className="p-2" id="root">
            {rootNotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notes yet</p>
                <p className="text-xs mt-1">Click + to create your first note</p>
              </div>
            ) : (
              rootNotes.map((note) => (
                <TreeNode
                  key={note.id}
                  note={note}
                  notes={filteredNotes}
                  depth={0}
                  onSelect={setActiveNote}
                  onRename={handleRename}
                  onDelete={deleteNote}
                  onToggleExpand={toggleFolderExpand}
                  onAddChild={(parentId, isFolder) => handleAddNote(isFolder, parentId)}
                  activeNoteId={activeNoteId}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </DndContext>
    </div>
  );
};