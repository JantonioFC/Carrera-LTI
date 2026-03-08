import React, { createContext, useContext, useReducer, useEffect } from 'react';
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

interface AetherContextType {
  notes: AetherNote[];
  addNote: (title?: string) => AetherNote;
  updateNote: (id: string, updates: Partial<AetherNote>) => void;
  deleteNote: (id: string) => void;
  getNote: (id: string) => AetherNote | undefined;
  getGraphData: () => GraphData;
  findBacklinks: (nodeId: string) => AetherNote[];
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  chatHistory: ChatMessage[];
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearChatHistory: () => void;
}

const AetherContext = createContext<AetherContextType | undefined>(undefined);

// Helper to extract [[WikiLinks]]
const extractLinks = (text: string): string[] => {
  const regex = /\[\[(.*?)\]\]/g;
  const links: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) links.push(match[1].trim());
  }
  return [...new Set(links)];
};

// --- Reducer Setup ---
interface AetherState {
  notes: AetherNote[];
  geminiApiKey: string;
  chatHistory: ChatMessage[];
}

type AetherAction = 
  | { type: 'ADD_NOTE'; payload: AetherNote }
  | { type: 'UPDATE_NOTE'; payload: { id: string; updates: Partial<AetherNote> } }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'CLEAR_CHAT_HISTORY' };

const aetherReducer = (state: AetherState, action: AetherAction): AetherState => {
  switch (action.type) {
    case 'ADD_NOTE':
      return { ...state, notes: [action.payload, ...state.notes] };
    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map(note => 
          note.id === action.payload.id ? { ...note, ...action.payload.updates, updatedAt: Date.now() } : note
        )
      };
    case 'DELETE_NOTE':
      return { ...state, notes: state.notes.filter(note => note.id !== action.payload) };
    case 'SET_API_KEY':
      return { ...state, geminiApiKey: action.payload };
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatHistory: [...state.chatHistory, action.payload] };
    case 'CLEAR_CHAT_HISTORY':
      return { ...state, chatHistory: [] };
    default:
      return state;
  }
};

export const AetherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialState: AetherState = {
    notes: safeParseJSON<AetherNote[]>('lti_aether_vault', [{
      id: uuidv4(),
      title: 'Bienvenido a Aether',
      content: '# Tu Segundo Cerebro\n\nAquí puedes escribir en formato Markdown. Prueba enlazar otra nota usando dobles corchetes, por ejemplo: [[Productividad]].',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['aether', 'inicio']
    }]),
    geminiApiKey: sessionStorage.getItem('lti_gemini_api_key') || '',
    chatHistory: safeParseJSON<ChatMessage[]>('lti_aether_chat', [])
  };

  const [state, dispatch] = useReducer(aetherReducer, initialState);

  // Sync with Storage
  useEffect(() => {
    localStorage.setItem('lti_aether_vault', JSON.stringify(state.notes));
  }, [state.notes]);

  useEffect(() => {
    localStorage.setItem('lti_aether_chat', JSON.stringify(state.chatHistory));
  }, [state.chatHistory]);

  const setGeminiApiKey = (key: string) => {
    sessionStorage.setItem('lti_gemini_api_key', key);
    dispatch({ type: 'SET_API_KEY', payload: key });
  };

  const addChatMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const fullMsg: ChatMessage = { ...msg, id: uuidv4(), timestamp: Date.now() };
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: fullMsg });
  };

  const clearChatHistory = () => {
    dispatch({ type: 'CLEAR_CHAT_HISTORY' });
  };

  const addNote = (title = 'Nueva Nota') => {
    const newNote: AetherNote = {
      id: uuidv4(),
      title,
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: []
    };
    dispatch({ type: 'ADD_NOTE', payload: newNote });
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<AetherNote>) => {
    dispatch({ type: 'UPDATE_NOTE', payload: { id, updates } });
  };

  const deleteNote = (id: string) => {
    dispatch({ type: 'DELETE_NOTE', payload: id });
  };

  const getNote = (id: string) => state.notes.find(n => n.id === id);

  // Computes the entire graph for the canvas
  const getGraphData = (): GraphData => {
    const nodes = state.notes.map(n => ({ id: n.id, name: n.title, val: 1 }));
    const links: GraphLink[] = [];

    state.notes.forEach(note => {
      const referencedTitles = extractLinks(note.content);
      referencedTitles.forEach(targetTitle => {
        // Find if target actually exists
        const targetNote = state.notes.find(n => n.title.toLowerCase() === targetTitle.toLowerCase());
        if (targetNote) {
          links.push({ source: note.id, target: targetNote.id });
        }
      });
    });

    return { nodes, links };
  };

  const findBacklinks = (nodeId: string): AetherNote[] => {
    const currentNote = getNote(nodeId);
    if (!currentNote) return [];

    return state.notes.filter(n => {
      if (n.id === nodeId) return false;
      const refs = extractLinks(n.content);
      return refs.some(ref => ref.toLowerCase() === currentNote.title.toLowerCase());
    });
  };

  return (
    <AetherContext.Provider value={{ 
      notes: state.notes, addNote, updateNote, deleteNote, getNote, getGraphData, findBacklinks,
      geminiApiKey: state.geminiApiKey, setGeminiApiKey, chatHistory: state.chatHistory, addChatMessage, clearChatHistory
    }}>
      {children}
    </AetherContext.Provider>
  );
};

export const useAether = () => {
  const context = useContext(AetherContext);
  if (context === undefined) {
    throw new Error('useAether must be used within an AetherProvider');
  }
  return context;
};
