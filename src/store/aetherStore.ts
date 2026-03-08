import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { safeParseJSON } from '../utils/safeStorage';

export interface AetherNote {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: { id: string; name: string; val: number }[];
  links: GraphLink[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

interface AetherState {
  notes: AetherNote[];
  geminiApiKey: string;
  chatHistory: ChatMessage[];
  
  // Actions
  addNote: (title?: string) => AetherNote;
  updateNote: (id: string, updates: Partial<AetherNote>) => void;
  deleteNote: (id: string) => void;
  getNote: (id: string) => AetherNote | undefined;
  getGraphData: () => GraphData;
  findBacklinks: (nodeId: string) => AetherNote[];
  setGeminiApiKey: (key: string) => void;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatHistory: () => void;
}

const extractLinks = (text: string): string[] => {
  const regex = /\[\[(.*?)\]\]/g;
  const links: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) links.push(match[1].trim());
  }
  return [...new Set(links)];
};

export const useAetherStore = create<AetherState>((set, get) => {
  // Initial sync with localStorage/sessionStorage
  const initialNotes = safeParseJSON<AetherNote[]>('lti_aether_vault', [{
    id: uuidv4(),
    title: 'Bienvenido a Aether',
    content: '# Tu Segundo Cerebro\n\nAquí puedes escribir en formato Markdown. Prueba enlazar otra nota usando dobles corchetes, por ejemplo: [[Productividad]].',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['aether', 'inicio']
  }]);
  const initialApiKey = sessionStorage.getItem('lti_gemini_api_key') || '';
  const initialChatHistory = safeParseJSON<ChatMessage[]>('lti_aether_chat', []);

  // Helper to sync to local storage on set
  const syncNotes = (notes: AetherNote[]) => {
    localStorage.setItem('lti_aether_vault', JSON.stringify(notes));
  };
  const syncChat = (chat: ChatMessage[]) => {
    localStorage.setItem('lti_aether_chat', JSON.stringify(chat));
  };

  return {
    notes: initialNotes,
    geminiApiKey: initialApiKey,
    chatHistory: initialChatHistory,
    
    addNote: (title = 'Nueva Nota') => {
      const newNote: AetherNote = {
        id: uuidv4(),
        title,
        content: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: []
      };
      set((state) => {
        const newNotes = [newNote, ...state.notes];
        syncNotes(newNotes);
        return { notes: newNotes };
      });
      return newNote;
    },
    
    updateNote: (id: string, updates: Partial<AetherNote>) => {
      set((state) => {
        const newNotes = state.notes.map(note => 
          note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
        );
        syncNotes(newNotes);
        return { notes: newNotes };
      });
    },

    deleteNote: (id: string) => {
      set((state) => {
        const newNotes = state.notes.filter(note => note.id !== id);
        syncNotes(newNotes);
        return { notes: newNotes };
      });
    },

    getNote: (id: string) => {
      return get().notes.find(n => n.id === id);
    },

    getGraphData: () => {
      const { notes } = get();
      const nodes = notes.map(n => ({ id: n.id, name: n.title, val: 1 }));
      const links: GraphLink[] = [];

      notes.forEach(note => {
        const referencedTitles = extractLinks(note.content);
        referencedTitles.forEach(targetTitle => {
          const targetNote = notes.find(n => n.title.toLowerCase() === targetTitle.toLowerCase());
          if (targetNote) {
            links.push({ source: note.id, target: targetNote.id });
          }
        });
      });

      return { nodes, links };
    },

    findBacklinks: (nodeId: string) => {
      const { notes, getNote } = get();
      const currentNote = getNote(nodeId);
      if (!currentNote) return [];

      return notes.filter(n => {
        if (n.id === nodeId) return false;
        const refs = extractLinks(n.content);
        return refs.some(ref => ref.toLowerCase() === currentNote.title.toLowerCase());
      });
    },

    setGeminiApiKey: (key: string) => {
      sessionStorage.setItem('lti_gemini_api_key', key);
      set({ geminiApiKey: key });
    },

    addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
      const fullMsg: ChatMessage = { ...msg, id: uuidv4(), timestamp: Date.now() };
      set((state) => {
        const newChat = [...state.chatHistory, fullMsg];
        syncChat(newChat);
        return { chatHistory: newChat };
      });
    },

    clearChatHistory: () => {
      set(() => {
        syncChat([]);
        return { chatHistory: [] };
      });
    }
  };
});
