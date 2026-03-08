import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

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

export const AetherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<AetherNote[]>(() => {
    const saved = localStorage.getItem('lti_aether_vault');
    if (saved) return JSON.parse(saved);
    return [{
      id: uuidv4(),
      title: 'Bienvenido a Aether',
      content: '# Tu Segundo Cerebro\n\nAquí puedes escribir en formato Markdown. Prueba enlazar otra nota usando dobles corchetes, por ejemplo: [[Productividad]].',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['aether', 'inicio']
    }];
  });

  const [geminiApiKey, setGeminiApiKeyState] = useState<string>(() => {
    return localStorage.getItem('lti_aether_gemini_key') || '';
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('lti_aether_chat');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('lti_aether_vault', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('lti_aether_chat', JSON.stringify(chatHistory));
  }, [chatHistory]);

  const setGeminiApiKey = (key: string) => {
    setGeminiApiKeyState(key);
    localStorage.setItem('lti_aether_gemini_key', key);
  };

  const addChatMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const fullMsg: ChatMessage = { ...msg, id: uuidv4(), timestamp: Date.now() };
    setChatHistory(prev => [...prev, fullMsg]);
  };

  const clearChatHistory = () => {
    setChatHistory([]);
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
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<AetherNote>) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, ...updates, updatedAt: Date.now() } : note
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const getNote = (id: string) => notes.find(n => n.id === id);

  // Computes the entire graph for the canvas
  const getGraphData = (): GraphData => {
    const nodes = notes.map(n => ({ id: n.id, name: n.title, val: 1 }));
    const links: GraphLink[] = [];

    notes.forEach(note => {
      const referencedTitles = extractLinks(note.content);
      referencedTitles.forEach(targetTitle => {
        // Find if target actually exists
        const targetNote = notes.find(n => n.title.toLowerCase() === targetTitle.toLowerCase());
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

    return notes.filter(n => {
      if (n.id === nodeId) return false;
      const refs = extractLinks(n.content);
      return refs.some(ref => ref.toLowerCase() === currentNote.title.toLowerCase());
    });
  };

  return (
    <AetherContext.Provider value={{ 
      notes, addNote, updateNote, deleteNote, getNote, getGraphData, findBacklinks,
      geminiApiKey, setGeminiApiKey, chatHistory, addChatMessage, clearChatHistory
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
