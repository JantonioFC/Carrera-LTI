import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { v4 as uuidv4 } from 'uuid';

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

export const NexusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<NexusDocument[]>(() => {
    const saved = localStorage.getItem('lti_nexus_docs');
    if (saved) return JSON.parse(saved);
    return [{
      id: uuidv4(),
      title: 'Bienvenido a Nexus',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['nexus', 'inicio']
    }];
  });

  const [yDocs, setYDocs] = useState<Record<string, Y.Doc>>({});

  useEffect(() => {
    localStorage.setItem('lti_nexus_docs', JSON.stringify(documents));
  }, [documents]);

  const getYDoc = (id: string): Y.Doc => {
    if (yDocs[id]) {
      return yDocs[id];
    }
    
    const ydoc = new Y.Doc();
    // @ts-ignore
    const provider = new IndexeddbPersistence(`nexus-doc-${id}`, ydoc);
    
    // We update the state to store the ydoc, but returning it immediately is fine
    setYDocs(prev => ({ ...prev, [id]: ydoc }));
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
    setDocuments(prev => [newDoc, ...prev]);
    return newDoc;
  };

  const updateDocument = (id: string, updates: Partial<NexusDocument>) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, ...updates, updatedAt: Date.now() } : doc
    ));
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    // Optional: Also clear the IndexeddbPersistence for this doc id to save space
    if (yDocs[id]) {
      yDocs[id].destroy();
        
      setYDocs(prev => {
        const newYDocs = { ...prev };
        delete newYDocs[id];
        return newYDocs;
      });
    }
  };

  const getDocument = (id: string) => documents.find(d => d.id === id);

  return (
    <NexusContext.Provider value={{ documents, addDocument, updateDocument, deleteDocument, getDocument, getYDoc }}>
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
