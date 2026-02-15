// NoteFlow Types

export interface Note {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  order: number;
  createdAt: number;
  updatedAt: number;
  isFolder: boolean;
  isExpanded?: boolean;
  tags?: string[];
}

export interface AIConversation {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type?: 'text' | 'audio' | 'image' | 'pdf';
  metadata?: {
    fileName?: string;
    fileType?: string;
    action?: string;
  };
}

export interface MeetingMinutes {
  topic: string;
  keyPoints: string[];
  actionItems: { task: string; assignee?: string; dueDate?: string }[];
  decisions: string[];
  summary: string;
}

export interface OCRResult {
  text: string;
  charts?: { description: string; data?: unknown }[];
  tables?: { headers: string[]; rows: string[][] }[];
  formulas?: string[];
}

export interface EditHistory {
  id: string;
  content: string;
  timestamp: number;
  action: string;
}

export interface AppSettings {
  apiKey: string;
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  lineHeigh: number;
  showWelcome: boolean;
}

export interface SearchQuery {
  text: string;
  scope: 'all' | 'title' | 'content';
}

export type AIAction = 
  | 'summarize'
  | 'expand'
  | 'condense'
  | 'formalize'
  | 'casual'
  | 'translate'
  | 'fix-grammar'
  | 'custom';

export interface AIEditRequest {
  action: AIAction;
  text: string;
  selectedText?: string;
  language?: string;
  customPrompt?: string;
}