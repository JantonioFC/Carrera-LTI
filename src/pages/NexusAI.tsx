import { useState, useCallback } from 'react';
import { useAether } from '../hooks/useAether';
import { useNexus } from '../hooks/useNexus';
import { useNexusDB } from '../hooks/useNexusDB';
import { GoogleGenAI } from '@google/genai';
import { Send, Bot, User, Trash2, Key, Sparkles, Database, FileText, Shield } from 'lucide-react';

interface NexusMessage {
  role: 'user' | 'model';
  content: string;
}

export default function NexusAI() {
  const { notes } = useAether();
  const { documents } = useNexus();
  const { allDatabases } = useNexusDB();

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('lti_gemini_api_key') || '');
  const [messages, setMessages] = useState<NexusMessage[]>(() => {
    const saved = localStorage.getItem('lti_nexus_ai_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(!apiKey);

  const saveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('lti_gemini_api_key', key);
    setShowKeyInput(false);
  };

  // Build a comprehensive context from ALL user data sources
  const buildSystemContext = useCallback(() => {
    let context = `Eres Nexus AI, un asistente de inteligencia integrada para un espacio de trabajo unificado.
Tienes acceso al contexto completo del usuario: notas de Aether, documentos de Nexus y bases de datos relacionales.
Responde siempre en español a menos que el usuario solicite otro idioma.
Sé conciso pero completo. Usa formato Markdown cuando sea útil.\n\n`;

    // Aether Notes
    if (notes.length > 0) {
      context += `### Notas de Aether (Segundo Cerebro)\n`;
      notes.forEach(n => {
        context += `- **${n.title}**: ${n.content.slice(0, 300)}...\n`;
      });
      context += '\n';
    }

    // Nexus Documents
    if (documents.length > 0) {
      context += `### Documentos Nexus (Block Editor)\n`;
      documents.forEach(d => {
        context += `- **${d.title}** (tags: ${d.tags.join(', ') || 'ninguno'})\n`;
      });
      context += '\n';
    }

    // Nexus Databases
    if (allDatabases.length > 0) {
      context += `### Bases de Datos Nexus\n`;
      allDatabases.forEach(db => {
        context += `- 📁 ${db.name}\n`;
      });
      context += '\n';
    }

    return context;
  }, [notes, documents, allDatabases]);

  const sendMessage = async () => {
    if (!input.trim() || !apiKey) return;

    const userMessage: NexusMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemContext = buildSystemContext();
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: systemContext }] },
          ...updatedMessages.map(m => ({
            role: m.role as 'user' | 'model',
            parts: [{ text: m.content }]
          }))
        ],
      });

      const aiText = response.text || 'No se recibió respuesta.';
      const aiMessage: NexusMessage = { role: 'model', content: aiText };
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      localStorage.setItem('lti_nexus_ai_history', JSON.stringify(finalMessages));
    } catch (err: any) {
      const errorMsg: NexusMessage = { role: 'model', content: `⚠️ Error: ${err.message || 'Error desconocido'}` };
      const finalMessages = [...updatedMessages, errorMsg];
      setMessages(finalMessages);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('lti_nexus_ai_history');
  };

  return (
    <div className="h-full flex flex-col bg-[#0d1117] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700/50 bg-navy-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-lg">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">Nexus AI</h1>
            <p className="text-xs text-slate-400">Inteligencia Unificada · RAG Multi-fuente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Data Summary Pills */}
          <div className="hidden md:flex items-center gap-2 mr-4">
            <span className="flex items-center gap-1 px-2 py-1 bg-navy-800 rounded-full text-xs text-slate-400 border border-navy-700">
              <FileText size={12} className="text-emerald-400" /> {notes.length + documents.length} docs
            </span>
            <span className="flex items-center gap-1 px-2 py-1 bg-navy-800 rounded-full text-xs text-slate-400 border border-navy-700">
              <Database size={12} className="text-lti-coral" /> {allDatabases.length} tablas
            </span>
            <span className="flex items-center gap-1 px-2 py-1 bg-navy-800 rounded-full text-xs text-slate-400 border border-navy-700">
              <Shield size={12} className="text-yellow-400" /> AES-256
            </span>
          </div>
          <button onClick={() => setShowKeyInput(!showKeyInput)} className="p-2 text-slate-400 hover:text-white hover:bg-navy-800 rounded-lg transition-colors" title="API Key">
            <Key size={18} />
          </button>
          <button onClick={clearChat} className="p-2 text-slate-400 hover:text-red-400 hover:bg-navy-800 rounded-lg transition-colors" title="Limpiar chat">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* API Key Input */}
      {showKeyInput && (
        <div className="px-6 py-3 bg-navy-950 border-b border-navy-700/50 flex items-center gap-3">
          <Key size={16} className="text-yellow-400 shrink-0" />
          <input 
            type="password"
            placeholder="Ingresa tu clave de Google AI Studio..."
            className="flex-1 bg-navy-800 border border-navy-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button onClick={() => saveKey(apiKey)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors">
            Guardar
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="p-4 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl mb-6">
              <Sparkles size={48} className="text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Nexus AI</h2>
            <p className="text-slate-400 max-w-md">
              Tu asistente con acceso completo a tus notas, documentos y bases de datos.
              Pregúntale sobre cualquier cosa de tu espacio de trabajo.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow">
                <Bot size={16} />
              </div>
            )}
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'bg-lti-blue text-white rounded-br-md' 
                : 'bg-navy-800 text-slate-200 border border-navy-700 rounded-bl-md'
            }`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-lti-blue/20 flex items-center justify-center shrink-0 mt-1">
                <User size={16} className="text-lti-blue" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow">
              <Bot size={16} />
            </div>
            <div className="bg-navy-800 border border-navy-700 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="px-6 py-4 border-t border-navy-700/50 bg-navy-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <input 
            type="text"
            placeholder={apiKey ? "Pregúntale a Nexus AI..." : "Configura tu API Key primero..."}
            className="flex-1 bg-navy-800 border border-navy-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={!apiKey || loading}
          />
          <button 
            onClick={sendMessage}
            disabled={!apiKey || loading || !input.trim()}
            className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
