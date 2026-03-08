import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { v4 as uuidv4 } from 'uuid';
import { safeParseJSON } from '../utils/safeStorage';

export interface NexusDocument {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

interface NexusContextType {
  documents: NexusDocument[];
  addDocument: (title?: string) => NexusDocument;
  updateDocument: (id: string, updates: Partial<NexusDocument>) => void;
  deleteDocument: (id: string) => void;
  getDocument: (id: string) => NexusDocument | undefined;
  // Gets the Yjs Doc for a specific NexusDocument ID
  getYDoc: (id: string) => Y.Doc;
}

const NexusContext = createContext<NexusContextType | undefined>(undefined);

// --- Reducer Setup ---
interface NexusState {
  documents: NexusDocument[];
  yDocs: Record<string, Y.Doc>;
}

type NexusAction =
  | { type: 'ADD_DOCUMENT'; payload: NexusDocument }
  | { type: 'UPDATE_DOCUMENT'; payload: { id: string; updates: Partial<NexusDocument> } }
  | { type: 'DELETE_DOCUMENT'; payload: string }
  | { type: 'REGISTER_YDOC'; payload: { id: string; ydoc: Y.Doc } };

const nexusReducer = (state: NexusState, action: NexusAction): NexusState => {
  switch (action.type) {
    case 'ADD_DOCUMENT':
      return { ...state, documents: [action.payload, ...state.documents] };
    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map(doc => 
          doc.id === action.payload.id ? { ...doc, ...action.payload.updates, updatedAt: Date.now() } : doc
        )
      };
    case 'DELETE_DOCUMENT': {
      const newYDocs = { ...state.yDocs };
      delete newYDocs[action.payload];
      return {
        ...state,
        documents: state.documents.filter(doc => doc.id !== action.payload),
        yDocs: newYDocs
      };
    }
    case 'REGISTER_YDOC':
      return {
        ...state,
        yDocs: { ...state.yDocs, [action.payload.id]: action.payload.ydoc }
      };
    default:
      return state;
  }
};

export const NexusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialState: NexusState = {
    documents: safeParseJSON<NexusDocument[]>('lti_nexus_docs', [{
      id: uuidv4(),
      title: 'Bienvenido a Nexus',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['nexus', 'inicio']
    }]),
    yDocs: {}
  };

  const [state, dispatch] = useReducer(nexusReducer, initialState);

  const yDocsCreating = useRef<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem('lti_nexus_docs', JSON.stringify(state.documents));
  }, [state.documents]);

  const getYDoc = (id: string): Y.Doc => {
    if (state.yDocs[id]) {
      return state.yDocs[id];
    }

    // Prevent duplicate creation from concurrent calls
    if (yDocsCreating.current.has(id)) {
      // Return a temporary doc — the real one will be in state shortly
      return state.yDocs[id] ?? new Y.Doc();
    }

    yDocsCreating.current.add(id);
    const ydoc = new Y.Doc();
    // IndexeddbPersistence manages its own lifecycle, we keep the reference alive via yDocs state
    void new IndexeddbPersistence(`nexus-doc-${id}`, ydoc);
    
    dispatch({ type: 'REGISTER_YDOC', payload: { id, ydoc } });
    yDocsCreating.current.delete(id);
    return ydoc;
  };

  const addDocument = (title = 'Página sin título') => {
    const newDoc: NexusDocument = {
      id: uuidv4(),
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: []
    };
    dispatch({ type: 'ADD_DOCUMENT', payload: newDoc });
    return newDoc;
  };

  const updateDocument = (id: string, updates: Partial<NexusDocument>) => {
    dispatch({ type: 'UPDATE_DOCUMENT', payload: { id, updates } });
  };

  const deleteDocument = (id: string) => {
    // Optional: Also clear the IndexeddbPersistence for this doc id to save space
    if (state.yDocs[id]) {
      state.yDocs[id].destroy();
    }
    dispatch({ type: 'DELETE_DOCUMENT', payload: id });
  };

  const getDocument = (id: string) => state.documents.find(d => d.id === id);

  return (
    <NexusContext.Provider value={{ documents: state.documents, addDocument, updateDocument, deleteDocument, getDocument, getYDoc }}>
      {children}
    </NexusContext.Provider>
  );
};

export const useNexus = () => {
  const context = useContext(NexusContext);
  if (context === undefined) {
    throw new Error('useNexus must be used within a NexusProvider');
  }
  return context;
};
