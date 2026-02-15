"use client";

import React, { useState, useRef, useEffect } from "react";
import { useNoteFlowStore } from "@/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Send,
  Upload,
  X,
  Sparkles,
  FileAudio,
  FileImage,
//   FileText,
  Wand2,
  RefreshCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
  Loader2,
  ArrowDownToLine,
} from "lucide-react";
import { AIConversation } from "@/types";

interface AIPanelProps {
  onInsertContent: (content: string) => void;
  onEditContent?: (content: string) => void;
}

export const AIPanel: React.FC<AIPanelProps> = ({
  onInsertContent,
  onEditContent,
}) => {
  const {
    aiConversations,
    isAILoading,
    settings,
    addAIConversation,
    clearAIConversations,
    setAILoading,
    activeNoteId,
  } = useNoteFlowStore();

  const [activeTab, setActiveTab] = useState("chat");
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editAction, setEditAction] = useState<string>("polish");
  const [language, setLanguage] = useState<string>("english");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiConversations]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const fileType = selectedFile.type;
    let type: "audio" | "image" | "pdf" = "audio";

    if (fileType.startsWith("audio/")) {
      type = "audio";
      setActiveTab("audio");
    } else if (fileType.startsWith("image/")) {
      type = "image";
      setActiveTab("vision");
    } else if (fileType === "application/pdf") {
      type = "pdf";
      setActiveTab("vision");
    }

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    // Add user message about upload
    addAIConversation({
      role: "user",
      content: `Uploaded file: ${selectedFile.name}`,
      type: type,
      metadata: {
        fileName: selectedFile.name,
        fileType: selectedFile.type,
      },
    });

    // Process file based on type
    setAILoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      let endpoint = "/api/ai/process";
      if (type === "audio") {
        endpoint = "/api/ai/transcribe";
      } else if (type === "image" || type === "pdf") {
        endpoint = "/api/ai/vision";
      }
      formData.append("apiKey", settings.apiKey);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Processing failed");
      }

      const result = await response.json();

      addAIConversation({
        role: "assistant",
        content: result.content || result.text || "Processed successfully",
        type: type,
        metadata: {
          action: type === "audio" ? "transcription" : "recognition",
        },
      });
    } catch (error) {
      addAIConversation({
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Processing failed"}`,
        type: type,
      });
    } finally {
      setAILoading(false);
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleChat = async () => {
    if (!inputText.trim() || isAILoading) return;

    const userMessage = inputText.trim();
    setInputText("");

    addAIConversation({
      role: "user",
      content: userMessage,
      type: "text",
    });

    setAILoading(true);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          apiKey: settings.apiKey,
          noteId: activeNoteId,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const result = await response.json();

      addAIConversation({
        role: "assistant",
        content: result.response,
        type: "text",
      });
    } catch (error) {
      addAIConversation({
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Request failed"}`,
        type: "text",
      });
    } finally {
      setAILoading(false);
    }
  };

  const handleEdit = async () => {
    if (!inputText.trim() || isAILoading) return;

    const textToEdit = inputText.trim();

    addAIConversation({
      role: "user",
      content: `Edit: "${textToEdit.substring(0, 50)}..."`,
      type: "text",
      metadata: { action: editAction },
    });

    setAILoading(true);
    try {
      const response = await fetch("/api/ai/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textToEdit,
          action: editAction,
          language,
          apiKey: settings.apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error("Edit request failed");
      }

      const result = await response.json();

      addAIConversation({
        role: "assistant",
        content: result.editedText,
        type: "text",
        metadata: { action: editAction },
      });
    } catch (error) {
      addAIConversation({
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Request failed"}`,
        type: "text",
      });
    } finally {
      setAILoading(false);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderMessage = (conv: AIConversation) => {
    const isExpanded = expandedId === conv.id;
    const shouldTruncate = conv.content.length > 300;

    return (
      <div
        key={conv.id}
        className={cn(
          "p-3 rounded-lg",
          conv.role === "user"
            ? "bg-secondary ml-4"
            : "bg-accent/50 ai-generated"
        )}
      >
        <div className="flex items-start gap-2">
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
              conv.role === "user" ? "bg-primary text-primary-foreground" : "bg-primary/20"
            )}
          >
            {conv.role === "user" ? (
              <User className="h-3 w-3" />
            ) : (
              <Bot className="h-3 w-3 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium capitalize">
                {conv.role === "user" ? "You" : "AI Assistant"}
              </span>
              {conv.type && conv.type !== "text" && (
                <Badge variant="outline" className="text-[10px] px-1">
                  {conv.type}
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground">
                {new Date(conv.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-sm whitespace-pre-wrap">
              {shouldTruncate && !isExpanded
                ? `${conv.content.substring(0, 300)}...`
                : conv.content}
            </div>
            {shouldTruncate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 mt-1 text-xs"
                onClick={() => setExpandedId(isExpanded ? null : conv.id)}
              >
                {isExpanded ? (
                  <>
                    Show less <ChevronUp className="h-3 w-3 ml-1" />
                  </>
                ) : (
                  <>
                    Show more <ChevronDown className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            )}
            {conv.role === "assistant" && (
              <div className="flex gap-1 mt-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => onInsertContent(conv.content)}
                      >
                        <ArrowDownToLine className="h-3 w-3 mr-1" />
                        Insert
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Insert into note</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => handleCopy(conv.content, conv.id)}
                >
                  {copiedId === conv.id ? (
                    <Check className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  {copiedId === conv.id ? "Copied" : "Copy"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 text-muted-foreground">
      <Sparkles className="h-12 w-12 mb-4 opacity-30" />
      <h3 className="font-medium mb-2">AI Assistant</h3>
      <p className="text-sm mb-4">
        Upload a file or enter a command to start AI collaboration
      </p>
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <FileAudio className="h-4 w-4" />
          <span>Upload audio for meeting minutes</span>
        </div>
        <div className="flex items-center gap-2">
          <FileImage className="h-4 w-4" />
          <span>Upload images for OCR recognition</span>
        </div>
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4" />
          <span>Use commands to edit content</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-card border-l">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">AI Assistant</h2>
        </div>
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={clearAIConversations}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear conversation</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start h-10 bg-transparent p-0">
            <TabsTrigger
              value="chat"
              className="data-[state=active]:bg-muted h-9 px-3"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger
              value="edit"
              className="data-[state=active]:bg-muted h-9 px-3"
            >
              Edit
            </TabsTrigger>
            <TabsTrigger
              value="audio"
              className="data-[state=active]:bg-muted h-9 px-3"
            >
              Audio
            </TabsTrigger>
            <TabsTrigger
              value="vision"
              className="data-[state=active]:bg-muted h-9 px-3"
            >
              Vision
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Conversation History */}
      <ScrollArea ref={scrollRef} className="flex-1 custom-scrollbar">
        <div className="p-3 space-y-3">
          {aiConversations.length === 0 ? (
            renderEmptyState()
          ) : (
            aiConversations.map(renderMessage)
          )}
          {isAILoading && (
            <div className="flex items-center gap-2 p-3 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Processing...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-3">
        {/* File Upload */}
        {(activeTab === "audio" || activeTab === "vision") && (
          <div className="mb-3">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={
                activeTab === "audio"
                  ? "audio/*"
                  : "image/*,.pdf"
              }
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              className="w-full h-10 border-dashed"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {activeTab === "audio"
                ? "Upload Audio (mp3/wav/m4a)"
                : "Upload Image or PDF"}
            </Button>

            {selectedFile && (
              <div className="mt-2 p-2 bg-muted rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm truncate flex-1">
                    {selectedFile.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <Progress value={uploadProgress} className="h-1" />
                )}
                <Button
                  size="sm"
                  className="w-full mt-2"
                  onClick={handleUpload}
                  disabled={isAILoading}
                >
                  {isAILoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Process
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Edit Options */}
        {activeTab === "edit" && (
          <div className="mb-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Action</Label>
                <Select value={editAction} onValueChange={setEditAction}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="polish">Polish</SelectItem>
                    <SelectItem value="expand">Expand</SelectItem>
                    <SelectItem value="condense">Condense</SelectItem>
                    <SelectItem value="formalize">Make Formal</SelectItem>
                    <SelectItem value="casual">Make Casual</SelectItem>
                    <SelectItem value="translate">Translate</SelectItem>
                    <SelectItem value="fix-grammar">Fix Grammar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editAction === "translate" && (
                <div>
                  <Label className="text-xs">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="chinese">Chinese</SelectItem>
                      <SelectItem value="japanese">Japanese</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                      <SelectItem value="german">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Text Input */}
        <div className="flex gap-2">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              activeTab === "chat"
                ? "Ask AI anything..."
                : activeTab === "edit"
                ? "Paste text to edit..."
                : "Add instructions (optional)..."
            }
            className="min-h-15 max-h-30 resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (activeTab === "edit") {
                  handleEdit();
                } else {
                  handleChat();
                }
              }
            }}
          />
        </div>

        <Button
          className="w-full mt-2"
          size="sm"
          onClick={activeTab === "edit" ? handleEdit : handleChat}
          disabled={!inputText.trim() || isAILoading}
        >
          {isAILoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          {activeTab === "edit" ? "Apply Edit" : "Send"}
        </Button>
      </div>
    </div>
  );
};