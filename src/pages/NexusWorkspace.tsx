import { useState, useMemo } from 'react';
import { useNexus } from '../hooks/useNexus';
import { BlockNoteEditor } from '@blocknote/core';
import '@blocknote/core/fonts/inter.css';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { Search, Plus, FileText, LayoutDashboard, Clock } from 'lucide-react';
import { esDictionary } from '../utils/blocknote-es';

export default function NexusWorkspace() {
  const { documents, addDocument, getDocument, getYDoc } = useNexus();
  const [activeDocId, setActiveDocId] = useState<string | null>(documents[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');

  const activeDoc = useMemo(() => activeDocId ? getDocument(activeDocId) : null, [activeDocId, documents, getDocument]);
  
  // Initialize BlockNote Editor connected to Yjs Document
  const editor = useMemo(() => {
    if (!activeDocId) return undefined;
    
    // Get the standard CRDT Y.Doc for this specific page
    const yDoc = getYDoc(activeDocId);
    
    return BlockNoteEditor.create({
      dictionary: esDictionary as any,
      collaboration: {
        provider: undefined as any, // We are syncing directly to IDB down below through yDoc
        fragment: yDoc.getXmlFragment("document-store"),
        user: {
          name: "User",
          color: "#3b82f6",
        },
      },
    });
  }, [activeDocId, getYDoc]);

  const filteredDocs = documents.filter(d => 
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex bg-navy-900 border-l border-navy-700/50" data-color-mode="dark">
      {/* Nexus Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col bg-navy-950/80 border-r border-navy-700/50">
        <div className="p-4 border-b border-navy-700/50 flex items-center justify-between">
          <h2 className="text-white font-bold tracking-wide flex items-center gap-2">
            <LayoutDashboard size={18} className="text-lti-blue" />
            Nexus
          </h2>
          <button 
            onClick={() => {
              const newDoc = addDocument();
              setActiveDocId(newDoc.id);
            }}
            className="p-1.5 bg-lti-blue/20 text-lti-blue hover:bg-lti-blue hover:text-white rounded-md transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-navy-900 border border-navy-700 rounded-md pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-lti-blue transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-1">
            <FileText size={12} /> Espacio Privado
          </div>
          <div className="space-y-0.5">
            {filteredDocs.map(doc => (
              <button
                key={doc.id}
                onClick={() => setActiveDocId(doc.id)}
                className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2 ${activeDocId === doc.id ? 'bg-navy-800 text-white font-medium' : 'text-slate-400 hover:bg-navy-800/50 hover:text-white'}`}
              >
                <FileText size={14} className={activeDocId === doc.id ? 'text-lti-blue' : 'text-slate-500'} />
                <span className="truncate">{doc.title}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-navy-700/50">
           <div className="flex items-center gap-2 text-xs text-slate-500">
               <Clock size={14} />
               <span>Sincronizado vía Local CRDT</span>
           </div>
        </div>
      </div>

      {/* Main Canvas Editor */}
      <div className="flex-1 flex flex-col bg-[#0d1117] overflow-y-auto">
        {activeDoc && editor ? (
          <div className="max-w-4xl mx-auto w-full px-8 py-12">
            <input 
              type="text"
              value={activeDoc.title}
              // Here we should update the title in the Context state, but for simplicity
              // in the editor demonstration we just render it. The context needs an updater.
              readOnly 
              className="w-full bg-transparent text-4xl font-extrabold text-white focus:outline-none placeholder-slate-600 mb-8 border-none ml-12"
              placeholder="Página sin título"
            />
            {/* The BlockNote editor */}
            <BlockNoteView 
              editor={editor} 
              theme="dark" 
              className="nexus-editor min-h-[500px]"
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            Selecciona o crea un documento para comenzar a editar.
          </div>
        )}
      </div>
    </div>
  );
}
