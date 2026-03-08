import { create } from 'zustand';
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

interface NexusState {
  documents: NexusDocument[];
  yDocs: Record<string, Y.Doc>;
  yDocsCreating: Set<string>;
  
  // Actions
  addDocument: (title?: string) => NexusDocument;
  updateDocument: (id: string, updates: Partial<NexusDocument>) => void;
  deleteDocument: (id: string) => void;
  getDocument: (id: string) => NexusDocument | undefined;
  getYDoc: (id: string) => Y.Doc;
}

export const useNexusStore = create<NexusState>((set, get) => {
  const initialDocuments = safeParseJSON<NexusDocument[]>('lti_nexus_docs', [{
    id: uuidv4(),
    title: 'Bienvenido a Nexus',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: ['nexus', 'inicio']
  }]);

  const syncDocuments = (docs: NexusDocument[]) => {
    localStorage.setItem('lti_nexus_docs', JSON.stringify(docs));
  };

  return {
    documents: initialDocuments,
    yDocs: {},
    yDocsCreating: new Set(),

    addDocument: (title = 'Página sin título') => {
      const newDoc: NexusDocument = {
        id: uuidv4(),
        title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: []
      };
      set((state) => {
        const newDocs = [newDoc, ...state.documents];
        syncDocuments(newDocs);
        return { documents: newDocs };
      });
      return newDoc;
    },

    updateDocument: (id: string, updates: Partial<NexusDocument>) => {
      set((state) => {
        const newDocs = state.documents.map(doc => 
          doc.id === id ? { ...doc, ...updates, updatedAt: Date.now() } : doc
        );
        syncDocuments(newDocs);
        return { documents: newDocs };
      });
    },

    deleteDocument: (id: string) => {
      const { yDocs } = get();
      if (yDocs[id]) {
        yDocs[id].destroy();
      }
      
      set((state) => {
        const newDocs = state.documents.filter(doc => doc.id !== id);
        syncDocuments(newDocs);
        
        const newYDocs = { ...state.yDocs };
        delete newYDocs[id];
        
        return { documents: newDocs, yDocs: newYDocs };
      });
    },

    getDocument: (id: string) => {
      return get().documents.find(d => d.id === id);
    },

    getYDoc: (id: string) => {
      const { yDocs, yDocsCreating } = get();
      
      if (yDocs[id]) {
        return yDocs[id];
      }

      if (yDocsCreating.has(id)) {
        return new Y.Doc(); // Temporary doc return while initializing
      }

      yDocsCreating.add(id);
      
      const ydoc = new Y.Doc();
      void new IndexeddbPersistence(`nexus-doc-${id}`, ydoc);
      
      set((state) => {
        const newYDocsCreating = new Set(state.yDocsCreating);
        newYDocsCreating.delete(id);
        
        return {
          yDocs: { ...state.yDocs, [id]: ydoc },
          yDocsCreating: newYDocsCreating
        };
      });
      
      return ydoc;
    }
  };
});
