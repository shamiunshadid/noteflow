"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNoteFlowStore } from "@/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Link2,
  Image,
  Eye,
  Edit3,
  Sparkles,
  Wand2,
  FileText,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

interface NoteEditorProps {
  onAIEdit?: (selectedText: string, action: string) => void;
}

// Separate the note content editor into its own component to handle key-based resets
const NoteContent: React.FC<{
  noteId: string;
  initialContent: string;
  initialTitle: string;
  isFolder: boolean;
  updatedAt: number;
  onAIEdit?: (selectedText: string, action: string) => void;
}> = ({ noteId, initialContent, initialTitle, isFolder, updatedAt, onAIEdit }) => {
  const { updateNote, pushHistory } = useNoteFlowStore();
  const [isPreview, setIsPreview] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle);
  const [selectedText, setSelectedText] = useState("");
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);

  // Auto-save with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content !== initialContent) {
        pushHistory(noteId, initialContent, "edit");
        updateNote(noteId, { content });
      }
      if (title !== initialTitle && title.trim()) {
        updateNote(noteId, { title });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [content, title, noteId, initialContent, initialTitle, updateNote, pushHistory]);

  const handleTextSelection = useCallback(() => {
    if (!textareaRef) return;
    const start = textareaRef.selectionStart;
    const end = textareaRef.selectionEnd;
    if (start !== end) {
      setSelectedText(content.substring(start, end));
    }
  }, [textareaRef, content]);

  const insertMarkdown = useCallback(
    (prefix: string, suffix: string = "", placeholder: string = "") => {
      if (!textareaRef) return;
      const start = textareaRef.selectionStart;
      const end = textareaRef.selectionEnd;
      const selectedText = content.substring(start, end) || placeholder;
      const newContent =
        content.substring(0, start) +
        prefix +
        selectedText +
        suffix +
        content.substring(end);
      setContent(newContent);

      // Set cursor position
      setTimeout(() => {
        textareaRef.focus();
        const newPos = start + prefix.length + selectedText.length;
        textareaRef.setSelectionRange(newPos, newPos);
      }, 0);
    },
    [textareaRef, content]
  );

  const toolbarButtons = [
    {
      icon: Heading1,
      label: "Heading 1",
      action: () => insertMarkdown("# ", "", "Heading"),
    },
    {
      icon: Heading2,
      label: "Heading 2",
      action: () => insertMarkdown("## ", "", "Heading"),
    },
    { icon: Bold, label: "Bold", action: () => insertMarkdown("**", "**", "bold") },
    {
      icon: Italic,
      label: "Italic",
      action: () => insertMarkdown("_", "_", "italic"),
    },
    { icon: List, label: "Bullet List", action: () => insertMarkdown("- ", "", "item") },
    {
      icon: ListOrdered,
      label: "Numbered List",
      action: () => insertMarkdown("1. ", "", "item"),
    },
    { icon: Quote, label: "Quote", action: () => insertMarkdown("> ", "", "quote") },
    { icon: Code, label: "Code", action: () => insertMarkdown("`", "`", "code") },
    {
      icon: Link2,
      label: "Link",
      action: () => insertMarkdown("[", "](url)", "text"),
    },
    {
      icon: Image,
      label: "Image",
      action: () => insertMarkdown("![alt](", ")", "url"),
    },
  ];

  return (
    <div className="h-full flex flex-col bg-background animate-fade-in">
      {/* Title */}
      <div className="border-b p-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="text-2xl font-semibold bg-transparent border-none outline-none w-full placeholder:text-muted-foreground"
        />
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            {isFolder ? "Folder" : "Note"}
          </Badge>
          <span>•</span>
          <span>
            Updated {new Date(updatedAt).toLocaleDateString()}
          </span>
          {selectedText && (
            <>
              <span>•</span>
              <Badge variant="outline" className="text-xs">
                {selectedText.length} chars selected
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <TooltipProvider>
            {toolbarButtons.map((btn, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={btn.action}
                  >
                    <btn.icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{btn.label}</TooltipContent>
              </Tooltip>
            ))}
            <div className="w-px h-6 bg-border mx-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("h-8 w-8", selectedText && "text-primary")}
                  onClick={() => onAIEdit?.(selectedText, "edit")}
                  disabled={!selectedText}
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>AI Edit Selected</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onAIEdit?.(content, "polish")}
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>AI Polish All</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isPreview ? "outline" : "ghost"}
            size="sm"
            onClick={() => setIsPreview(false)}
            className={cn(!isPreview && "bg-muted")}
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant={isPreview ? "outline" : "ghost"}
            size="sm"
            onClick={() => setIsPreview(true)}
            className={cn(isPreview && "bg-muted")}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
        </div>
      </div>

      {/* Editor / Preview */}
      <ScrollArea className="flex-1 custom-scrollbar">
        {isPreview ? (
          <div className="p-6 prose prose-sm max-w-none markdown-content">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match;
                  return isInline ? (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  ) : (
                    <SyntaxHighlighter
                      style={oneLight}
                      language={match[1]}
                      PreTag="div"
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  );
                },
              }}
            >
              {content || "*No content yet...*"}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="p-4">
            <Textarea
              ref={setTextareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onSelect={handleTextSelection}
              onKeyUp={handleTextSelection}
              placeholder="Start writing your note...

# Heading 1
## Heading 2

**Bold** and _italic_ text

- Bullet list
- Another item

1. Numbered list
2. Second item

> Quote

`inline code`

```
code block
```

[Link](url)
![Image](url)"
              className="min-h-[calc(100vh-280px)] border-none resize-none focus-visible:ring-0 text-base leading-relaxed font-mono"
            />
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export const NoteEditor: React.FC<NoteEditorProps> = ({ onAIEdit }) => {
  const { notes, activeNoteId } = useNoteFlowStore();

  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId),
    [notes, activeNoteId]
  );

  if (!activeNote) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center text-muted-foreground">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-medium mb-2">No Note Selected</h3>
          <p className="text-sm">Select a note from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }

  // Use key to force remount when note changes
  return (
    <NoteContent
      key={activeNote.id}
      noteId={activeNote.id}
      initialContent={activeNote.content}
      initialTitle={activeNote.title}
      isFolder={activeNote.isFolder}
      updatedAt={activeNote.updatedAt}
      onAIEdit={onAIEdit}
    />
  );
};