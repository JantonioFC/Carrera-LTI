import {
	Database,
	FileText,
	Key,
	Shield,
	Sparkles,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ChatBubble } from "../components/chat/ChatBubble";
import { ChatInputArea } from "../components/chat/ChatInputArea";
import { ChatSkeleton } from "../components/chat/ChatSkeleton";
import { useNexusDB } from "../hooks/useNexusDB";
import { apiBackend } from "../services/aiClient";
import { useAetherStore } from "../store/aetherStore";
import { useNexusStore } from "../store/nexusStore";
import { useUserConfigStore } from "../store/userConfigStore";
import { truncateContext } from "../utils/aiUtils";
import {
	failure,
	isLoading,
	loading,
	notAsked,
	type RemoteData,
	success,
} from "../utils/result";
import { safeParseJSON } from "../utils/safeStorage";

interface NexusMessage {
	role: "user" | "model";
	content: string;
}

export default function NexusAI() {
	const { notes } = useAetherStore();
	const { geminiApiKey: apiKey, setGeminiApiKey } = useUserConfigStore();
	const { documents } = useNexusStore();
	const { allDatabases } = useNexusDB();

	const [messages, setMessages] = useState<NexusMessage[]>(() => {
		return safeParseJSON<NexusMessage[]>("lti_nexus_ai_history", []);
	});
	const [input, setInput] = useState("");
	const [status, setStatus] = useState<RemoteData<void, string>>(notAsked());
	const [showKeyInput, setShowKeyInput] = useState(false);

	// Sync showKeyInput with apiKey (closes when hydrated/configured)
	useEffect(() => {
		setShowKeyInput(!apiKey);
	}, [apiKey]);

	const saveKey = (key: string) => {
		setGeminiApiKey(key);
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
			notes.forEach((n) => {
				context += `- **${n.title}**: ${n.content.slice(0, 300)}...\n`;
			});
			context += "\n";
		}

		// Nexus Documents
		if (documents.length > 0) {
			context += `### Documentos Nexus (Block Editor)\n`;
			documents.forEach((d) => {
				context += `- **${d.title}** (tags: ${d.tags.join(", ") || "ninguno"})\n`;
			});
			context += "\n";
		}

		// Nexus Databases
		if (allDatabases.length > 0) {
			context += `### Bases de Datos Nexus\n`;
			allDatabases.forEach((db) => {
				context += `- 📁 ${db.name}\n`;
			});
			context += "\n";
		}

		return truncateContext(context, 40000); // 40k chars limit
	}, [notes, documents, allDatabases]);

	const sendMessage = async () => {
		if (!input.trim() || !apiKey) return;

		const userMessage: NexusMessage = { role: "user", content: input };
		const updatedMessages = [...messages, userMessage];
		setMessages(updatedMessages);
		setInput("");
		setStatus(loading());

		try {
			apiBackend.updateApiKey(apiKey);
			const systemContext = buildSystemContext();

			const payloadMessages = updatedMessages.slice(-10).map((m) => ({
				role: m.role as "user" | "model",
				parts: [{ text: m.content }],
			}));

			const aiMessage: NexusMessage = { role: "model", content: "" };
			setMessages((prev) => [...prev, aiMessage]);

			let currentText = "";
			await apiBackend.askNexusStream(
				payloadMessages,
				systemContext,
				(chunk) => {
					currentText += chunk;
					setMessages((prev) => {
						const newMsgs = [...prev];
						const lastMsg = newMsgs[newMsgs.length - 1];
						if (lastMsg && lastMsg.role === "model") {
							// Return a new object for immutability
							newMsgs[newMsgs.length - 1] = {
								...lastMsg,
								content: currentText,
							};
						}
						return newMsgs;
					});
				},
			);

			// Save to localStorage after stream completes.
			// Usar estado final derivado en lugar de setMessages como canal de
			// efecto secundario — anti-patrón en React Concurrent Mode (#185).
			const finalHistory = [
				...updatedMessages,
				{ role: "model" as const, content: currentText },
			];
			localStorage.setItem(
				"lti_nexus_ai_history",
				JSON.stringify(finalHistory),
			);

			setStatus(success(undefined));
		} catch (err: any) {
			const errorMsg: NexusMessage = {
				role: "model",
				content: `⚠️ Error: ${err.message || "Error desconocido"}`,
			};
			const finalMessages = [...updatedMessages, errorMsg];
			setMessages(finalMessages);
			setStatus(failure(err.message));
		}
	};

	const clearChat = () => {
		setMessages([]);
		localStorage.removeItem("lti_nexus_ai_history");
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
						<p className="text-xs text-slate-400">
							Inteligencia Unificada · RAG Multi-fuente
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					{/* Data Summary Pills */}
					<div className="hidden md:flex items-center gap-2 mr-4">
						<span className="flex items-center gap-1 px-2 py-1 bg-navy-800 rounded-full text-xs text-slate-400 border border-navy-700">
							<FileText size={12} className="text-emerald-400" />{" "}
							{notes.length + documents.length} docs
						</span>
						<span className="flex items-center gap-1 px-2 py-1 bg-navy-800 rounded-full text-xs text-slate-400 border border-navy-700">
							<Database size={12} className="text-lti-coral" />{" "}
							{allDatabases.length} tablas
						</span>
						<span className="flex items-center gap-1 px-2 py-1 bg-navy-800 rounded-full text-xs text-slate-400 border border-navy-700">
							<Shield size={12} className="text-yellow-400" /> AES-256
						</span>
					</div>
					<button
						onClick={() => setShowKeyInput(!showKeyInput)}
						className="p-2 text-slate-400 hover:text-white hover:bg-navy-800 rounded-lg transition-colors"
						title="API Key"
					>
						<Key size={18} />
					</button>
					<button
						onClick={clearChat}
						className="p-2 text-slate-400 hover:text-red-400 hover:bg-navy-800 rounded-lg transition-colors"
						title="Limpiar chat"
					>
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
						onChange={(e) => setGeminiApiKey(e.target.value)}
					/>
					<button
						onClick={() => saveKey(apiKey)}
						className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
					>
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
							Tu asistente con acceso completo a tus notas, documentos y bases
							de datos. Pregúntale sobre cualquier cosa de tu espacio de
							trabajo.
						</p>
					</div>
				)}

				{messages.map((msg, i) => (
					<ChatBubble
						key={i}
						role={msg.role}
						text={msg.content}
						flavor="nexus"
					/>
				))}

				{isLoading(status) && <ChatSkeleton flavor="nexus" />}
			</div>

			{/* Input Bar */}
			<ChatInputArea
				prompt={input}
				setPrompt={setInput}
				onSubmit={(e) => {
					e.preventDefault();
					sendMessage();
				}}
				isLoading={isLoading(status)}
				disabledMsg={
					apiKey
						? "Pregúntale a Nexus AI..."
						: "Configura tu API Key primero..."
				}
				flavor="nexus"
			/>
		</div>
	);
}
