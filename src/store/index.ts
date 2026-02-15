import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Note, AIConversation, AppSettings, EditHistory } from '@/types';

interface NoteFlowState {
  // Notes
  notes: Note[];
  activeNoteId: string | null;
  searchQuery: string;
  
  // AI
  aiConversations: AIConversation[];
  isAILoading: boolean;
  
  // Settings
  settings: AppSettings;
  
  // UI State
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  showSettings: boolean;
  showWelcome: boolean;
  editHistory: Map<string, EditHistory[]>;
  
  // Note Actions
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => string;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  moveNote: (id: string, newParentId: string | null, newOrder: number) => void;
  setActiveNote: (id: string | null) => void;
  toggleFolderExpand: (id: string) => void;
  setSearchQuery: (query: string) => void;
  
  // AI Actions
  addAIConversation: (conv: Omit<AIConversation, 'id' | 'timestamp'>) => void;
  clearAIConversations: () => void;
  setAILoading: (loading: boolean) => void;
  
  // Settings Actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // UI Actions
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setShowSettings: (show: boolean) => void;
  setShowWelcome: (show: boolean) => void;
  
  // History Actions
  pushHistory: (noteId: string, content: string, action: string) => void;
  undoHistory: (noteId: string) => string | null;
  redoHistory: (noteId: string) => string | null;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

// Custom storage for IndexedDB
const indexedDBStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const request = indexedDB.open('NoteFlowDB', 1);
      
      request.onerror = () => resolve(null);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('store')) {
          db.createObjectStore('store');
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction('store', 'readonly');
        const store = transaction.objectStore('store');
        const getRequest = store.get(name);
        
        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => resolve(null);
      };
    });
  },
  
  setItem: async (name: string, value: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NoteFlowDB', 1);
      
      request.onerror = () => reject();
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('store')) {
          db.createObjectStore('store');
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction('store', 'readwrite');
        const store = transaction.objectStore('store');
        store.put(value, name);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject();
      };
    });
  },
  
  removeItem: async (name: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NoteFlowDB', 1);
      
      request.onerror = () => reject();
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('store')) {
          db.createObjectStore('store');
        }
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction('store', 'readwrite');
        const store = transaction.objectStore('store');
        store.delete(name);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject();
      };
    });
  },
};

export const useNoteFlowStore = create<NoteFlowState>()(
  persist(
    (set, get) => ({
      // Initial state
      notes: [],
      activeNoteId: null,
      searchQuery: '',
      aiConversations: [],
      isAILoading: false,
      settings: {
        apiKey: '',
        theme: 'system',
        fontSize: 16,
        lineHeigh: 1.6,
        showWelcome: true,
      },
      leftPanelCollapsed: false,
      rightPanelCollapsed: true,
      showSettings: false,
      showWelcome: true,
      editHistory: new Map(),
      
      // Note Actions
      addNote: (note) => {
        const id = generateId();
        const now = Date.now();
        const notes = get().notes;
        const siblings = notes.filter(n => n.parentId === note.parentId);
        const maxOrder = siblings.length > 0 ? Math.max(...siblings.map(n => n.order)) : -1;
        
        set((state) => ({
          notes: [
            ...state.notes,
            {
              ...note,
              id,
              createdAt: now,
              updatedAt: now,
              order: maxOrder + 1,
            },
          ],
          activeNoteId: id,
        }));
        
        return id;
      },
      
      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, ...updates, updatedAt: Date.now() }
              : note
          ),
        }));
      },
      
      deleteNote: (id) => {
        const deleteRecursive = (noteId: string, notes: Note[]): Note[] => {
          const children = notes.filter(n => n.parentId === noteId);
          let filtered = notes.filter(n => n.id !== noteId);
          children.forEach(child => {
            filtered = deleteRecursive(child.id, filtered);
          });
          return filtered;
        };
        
        set((state) => ({
          notes: deleteRecursive(id, state.notes),
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
        }));
      },
      
      moveNote: (id, newParentId, newOrder) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, parentId: newParentId, order: newOrder, updatedAt: Date.now() }
              : note
          ),
        }));
      },
      
      setActiveNote: (id) => {
        set({ activeNoteId: id });
      },
      
      toggleFolderExpand: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, isExpanded: !note.isExpanded } : note
          ),
        }));
      },
      
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },
      
      // AI Actions
      addAIConversation: (conv) => {
        set((state) => ({
          aiConversations: [
            ...state.aiConversations,
            {
              ...conv,
              id: generateId(),
              timestamp: Date.now(),
            },
          ],
        }));
      },
      
      clearAIConversations: () => {
        set({ aiConversations: [] });
      },
      
      setAILoading: (loading) => {
        set({ isAILoading: loading });
      },
      
      // Settings Actions
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },
      
      // UI Actions
      toggleLeftPanel: () => {
        set((state) => ({ leftPanelCollapsed: !state.leftPanelCollapsed }));
      },
      
      toggleRightPanel: () => {
        set((state) => ({ rightPanelCollapsed: !state.rightPanelCollapsed }));
      },
      
      setShowSettings: (show) => {
        set({ showSettings: show });
      },
      
      setShowWelcome: (show) => {
        set({ showWelcome: show });
      },
      
      // History Actions
      pushHistory: (noteId, content, action) => {
        const history = get().editHistory;
        const noteHistory = history.get(noteId) || [];
        
        const newHistory = new Map(history);
        newHistory.set(noteId, [
          ...noteHistory.slice(-19), // Keep last 20 entries
          {
            id: generateId(),
            content,
            timestamp: Date.now(),
            action,
          },
        ]);
        
        set({ editHistory: newHistory });
      },
      
      undoHistory: (noteId) => {
        const history = get().editHistory;
        const noteHistory = history.get(noteId) || [];
        
        if (noteHistory.length === 0) return null;
        
        const lastEntry = noteHistory[noteHistory.length - 1];
        return lastEntry.content;
      },
      
      redoHistory: (noteId) => {
        // For now, return null as redo is more complex
        return null;
      },
    }),
    {
      name: 'noteflow-storage',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({
        notes: state.notes,
        settings: state.settings,
        aiConversations: state.aiConversations,
        showWelcome: state.showWelcome,
      }),
    }
  )
);