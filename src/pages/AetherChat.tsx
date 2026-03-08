import { useState, useRef, useEffect } from 'react';
import { useAether } from '../hooks/useAether';
import { GoogleGenAI } from '@google/genai';
import { Key, Send, Bot, User, Trash2, Brain } from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';

export default function AetherChat() {
  const { notes, geminiApiKey, setGeminiApiKey, chatHistory, addChatMessage, clearChatHistory } = useAether();
  const [inputKey, setInputKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputKey.trim()) {
      setGeminiApiKey(inputKey.trim());
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !geminiApiKey) return;

    const userText = prompt.trim();
    setPrompt('');
    addChatMessage({ role: 'user', text: userText });
    setIsLoading(true);

    try {
      // Initialize Gemini Client
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      // Build context from notes (Simplified local RAG)
      const contextText = notes.map(n => `Nota: ${n.title}\nContenido:\n${n.content}\n---`).join('\n\n');
      
      const systemInstruction = `Eres Aether, un asistente de IA de "Segundo Cerebro". 
Tu objetivo es ayudar al usuario a recordar, conectar y generar ideas basadas EXCLUSIVAMENTE en sus propias notas (a menos que pida conocimiento general explícitamente).
Responde en formato Markdown. Sé conciso y referencía los nombres de las notas cuando uses su información.

Aquí están las notas actuales del usuario en su bóveda:
${contextText}`;

      // Call Gemini API (gemini-2.5-flash is fast and usually default or gemini-2.0-flash)
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userText,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7
        }
      });

      addChatMessage({ 
        role: 'model', 
        text: response.text || 'Sin respuesta del modelo.' 
      });

    } catch (error: any) {
      console.error("Gemini API Error:", error);
      addChatMessage({ 
        role: 'model', 
        text: `**Error de Conexión:** ${error.message || 'No se pudo contactar con Gemini. Revisa tu API Key o conexión a internet.'}` 
      });
      // If unauthorized, clear key to prompt again
      if (error.status === 401 || error.message?.includes('API key not valid')) {
        setGeminiApiKey('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!geminiApiKey) {
    return (
      <div className="h-full flex items-center justify-center bg-navy-900" data-color-mode="dark">
        <div className="bg-navy-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-navy-700">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-lti-blue/20 rounded-full flex items-center justify-center">
              <Key size={32} className="text-lti-blue" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-2">Conectar a Gemini</h2>
          <p className="text-slate-400 text-center mb-6 text-sm">
            Para mantener tu bóveda privada y gratuita, Aether utiliza tu propia clave API de Google Gemini (AI Studio). Se guardará localmente en tu dispositivo.
          </p>
          <form onSubmit={handleSaveKey} className="space-y-4">
            <div>
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-navy-900 border border-navy-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-lti-blue focus:ring-1 focus:ring-lti-blue"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-lti-blue hover:bg-lti-blue-dark text-white font-medium py-3 rounded-lg transition-colors"
            >
              Guardar y Conectar
            </button>
          </form>
          <p className="mt-4 text-xs text-slate-500 text-center">
            Puedes obtener una clave gratuita en <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-lti-blue hover:underline">Google AI Studio</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-navy-900 border-l border-navy-700/50" data-color-mode="dark">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-navy-700/50 bg-navy-950/80 shrink-0">
        <div className="flex items-center gap-3">
          <Brain size={20} className="text-lti-coral" />
          <h1 className="text-white font-semibold flex items-center gap-2">
            Asistente Aether
            <span className="px-2 py-0.5 rounded-full bg-lti-blue/20 text-lti-blue text-[10px] uppercase font-bold tracking-wider">Gemini-2.5-Flash</span>
          </h1>
        </div>
        <button
          onClick={() => {
            if(confirm('¿Eliminar todo el historial de chat?')) clearChatHistory();
          }}
          className="text-slate-400 hover:text-red-400 transition-colors flex items-center gap-2 text-sm"
          title="Limpiar chat"
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Limpiar</span>
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
            <Bot size={48} className="text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">¡Hola! Soy la consciencia de tu bóveda.</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              Conozco todas tus notas. Hazme cualquier pregunta, pídeme que resuma temas o que te ayude a encontrar conexiones entre tus ideas.
            </p>
          </div>
        ) : (
          chatHistory.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-lti-coral/20 flex flex-shrink-0 items-center justify-center self-end">
                  <Bot size={16} className="text-lti-coral" />
                </div>
              )}
              <div 
                className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                  msg.role === 'user' 
                    ? 'bg-lti-blue text-white rounded-br-sm' 
                    : 'bg-navy-800 border border-navy-700 text-slate-200 rounded-bl-sm markdown-body-override'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className="aether-chat-markdown">
                    <MDEditor.Markdown source={msg.text} style={{ backgroundColor: 'transparent', color: 'inherit' }} />
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-700 flex flex-shrink-0 items-center justify-center self-end">
                  <User size={16} className="text-slate-300" />
                </div>
              )}
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-lti-coral/20 flex flex-shrink-0 items-center justify-center self-end">
              <Bot size={16} className="text-lti-coral" />
            </div>
            <div className="bg-navy-800 border border-navy-700 rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-navy-950/50 border-t border-navy-700/50">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Pregúntale a tu segundo cerebro..."
            className="w-full bg-navy-900 border border-navy-700 text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-lti-blue focus:ring-1 focus:ring-lti-blue transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-lti-blue disabled:opacity-50 disabled:hover:text-slate-400 transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
        <div className="text-center mt-2">
           <button onClick={() => setGeminiApiKey('')} className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
              [Desvincular API Key]
           </button>
        </div>
      </div>
    </div>
  );
}
