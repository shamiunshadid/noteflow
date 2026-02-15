"use client";

import React, { useState, useCallback } from "react";
import { Panel, PanelGroup, PanelResizeHandle, } from "react-resizable-panels";
import { useNoteFlowStore } from "@/store";
import { DocumentTree } from "@/components/noteflow/DocumentTree";
import { NoteEditor } from "@/components/noteflow/NoteEditor";
import { AIPanel } from "@/components/noteflow/AiPanel";
import { SettingsDialog } from "@/components/noteflow/SettingsDialog";
import { WelcomeModal } from "@/components/noteflow/WelcomeModal";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PanelLeftClose,
  PanelLeft,
  // PanelRightClose,
  // PanelRight,
  Settings,
  Moon,
  Sun,
  Sparkles,
  FileText,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function NoteFlowPage() {
  const {
    notes,
    activeNoteId,
    leftPanelCollapsed,
    rightPanelCollapsed,
    toggleLeftPanel,
    toggleRightPanel,
    setShowSettings,
    updateNote,
  } = useNoteFlowStore();
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeNote = notes.find((n) => n.id === activeNoteId);

  const handleInsertContent = useCallback(
    (content: string) => {
      if (activeNoteId) {
        updateNote(activeNoteId, {
          content: activeNote?.content
            ? `${activeNote.content}\n\n${content}`
            : content,
        });
      }
    },
    [activeNoteId, activeNote, updateNote]
  );

  const handleAIEdit = useCallback(
    (text: string, action: string) => {
      // This would open the AI panel and set up for editing
      // For now, we'll use the right panel
    },
    []
  );

  if (!isMounted) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Toolbar */}
      <header className="h-12 border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleLeftPanel}
                >
                  {leftPanelCollapsed ? (
                    <PanelLeft className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {leftPanelCollapsed ? "Show sidebar" : "Hide sidebar"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-2 ml-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">NoteFlow</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {activeNote && (
            <span className="text-sm text-muted-foreground mr-4 max-w-50 truncate">
              {activeNote.title}
            </span>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle theme</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    !rightPanelCollapsed && "bg-muted"
                  )}
                  onClick={toggleRightPanel}
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>AI Assistant</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Document Tree */}
          <Panel
            defaultSize={20}
            minSize={15}
            maxSize={35}
            className={cn(
              "transition-all duration-200",
              leftPanelCollapsed && "flex-[0_0_0px]!"
            )}
          >
            <DocumentTree />
          </Panel>

          {!leftPanelCollapsed && (
            <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
          )}

          {/* Center Panel - Editor */}
          <Panel defaultSize={rightPanelCollapsed ? 80 : 55} minSize={40}>
            <NoteEditor onAIEdit={handleAIEdit} />
          </Panel>

          {!rightPanelCollapsed && (
            <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />
          )}

          {/* Right Panel - AI Assistant */}
          <Panel
            defaultSize={25}
            minSize={20}
            maxSize={40}
            className={cn(
              "transition-all duration-200",
              rightPanelCollapsed && "flex-[0_0_0px]!"
            )}
          >
            <AIPanel
              onInsertContent={handleInsertContent}
              onEditContent={handleAIEdit}
            />
          </Panel>
        </PanelGroup>
      </main>

      {/* Modals */}
      <SettingsDialog />
      <WelcomeModal />
    </div>
  );
}