import { Bot, Brain, Key, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChatBubble } from "../components/chat/ChatBubble";
import { ChatInputArea } from "../components/chat/ChatInputArea";
import { ChatSkeleton } from "../components/chat/ChatSkeleton";
import { apiBackend } from "../services/aiClient";
import { useAetherChatStore } from "../store/aetherChatStore";
import { useAetherStore } from "../store/aetherStore";
import { useUserConfigStore } from "../store/userConfigStore";
import { logger } from "../utils/logger";
import {
	failure,
	isLoading,
	loading,
	notAsked,
	type RemoteData,
	success,
} from "../utils/result";

export default function AetherChat() {
	const { semanticSearch } = useAetherStore();
	const { chatHistory, addChatMessage, appendChatMessage, clearChatHistory } =
		useAetherChatStore();
	const { geminiApiKey, setGeminiApiKey } = useUserConfigStore();
	const [inputKey, setInputKey] = useState("");
	const [prompt, setPrompt] = useState("");
	const [status, setStatus] = useState<RemoteData<void, string>>(notAsked());
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	const [isHydrated, setIsHydrated] = useState(() =>
		useAetherStore.persist.hasHydrated(),
	);
	useEffect(() => {
		// Suscribirse a onFinishHydration evita el polling con setInterval (#114)
		if (useAetherStore.persist.hasHydrated()) {
			setIsHydrated(true);
			return;
		}
		return useAetherStore.persist.onFinishHydration(() => setIsHydrated(true));
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [chatHistory, scrollToBottom]);

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
		setPrompt("");
		addChatMessage({ role: "user", text: userText });
		setStatus(loading());

		try {
			// Configure API Key locally in the Singleton
			apiBackend.updateApiKey(geminiApiKey);

			// Semantic Retrieval (RAG)
			const relevantNotes = await semanticSearch(userText, 5);

			// Build context string from retrieved notes
			const contextText =
				relevantNotes.length > 0
					? relevantNotes
							.map((n) => `Nota: ${n.title}\nContenido:\n${n.content}\n---`)
							.join("\n\n")
					: "No se encontraron notas relevantes directamente en la búsqueda semántica.";

			// Call Gemini API streaming method
			const msgId = addChatMessage({
				role: "model",
				text: "",
			});

			await apiBackend.askAetherStream(userText, contextText, (chunk) => {
				appendChatMessage(msgId, chunk);
			});

			setStatus(success(undefined));
		} catch (error: any) {
			logger.error("AetherChat", "Gemini API Error", error);
			addChatMessage({
				role: "model",
				text: `**Error de Conexión:** ${error.message || "No se pudo contactar con Gemini. Revisa tu API Key o conexión al servicio."}`,
			});
			// If unauthorized, clear key to prompt again
			if (
				error.status === 401 ||
				error.message?.includes("API key not valid")
			) {
				setGeminiApiKey("");
			}
			setStatus(failure(error.message));
		}
	};

	// Prevent form from flashing before IndexedDB completes
	if (!isHydrated) {
		return (
			<div className="h-full flex items-center justify-center bg-navy-900">
				<ChatSkeleton flavor="aether" />
			</div>
		);
	}

	if (!geminiApiKey) {
		return (
			<div
				className="h-full flex items-center justify-center bg-navy-900"
				data-color-mode="dark"
			>
				<div className="bg-navy-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-navy-700">
					<div className="flex justify-center mb-6">
						<div className="w-16 h-16 bg-lti-blue/20 rounded-full flex items-center justify-center">
							<Key size={32} className="text-lti-blue" />
						</div>
					</div>
					<h2 className="text-2xl font-bold text-white text-center mb-2">
						Conectar a Gemini
					</h2>
					<p className="text-slate-400 text-center mb-6 text-sm">
						Para mantener tu bóveda privada y gratuita, Aether utiliza tu propia
						clave API de Google Gemini (AI Studio). Se guardará localmente en tu
						dispositivo.
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
					<p className="mt-4 text-xs text-slate-400 text-center">
						Puedes obtener una clave gratuita en{" "}
						<a
							href="https://aistudio.google.com/app/apikey"
							target="_blank"
							rel="noreferrer"
							className="text-lti-blue hover:underline"
						>
							Google AI Studio
						</a>
						.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div
			className="h-full flex flex-col bg-navy-900 border-l border-navy-700/50"
			data-color-mode="dark"
		>
			{/* Header */}
			<div className="h-14 flex items-center justify-between px-6 border-b border-navy-700/50 bg-navy-950/80 shrink-0">
				<div className="flex items-center gap-3">
					<Brain size={20} className="text-lti-coral" />
					<h1 className="text-white font-semibold flex items-center gap-2">
						Asistente Aether
						<span className="px-2 py-0.5 rounded-full bg-lti-blue/20 text-lti-blue text-[10px] uppercase font-bold tracking-wider">
							Gemini-2.5-Flash
						</span>
					</h1>
				</div>
				<button
					onClick={() => {
						if (confirm("¿Eliminar todo el historial de chat?"))
							clearChatHistory();
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
						<h3 className="text-lg font-medium text-white mb-2">
							¡Hola! Soy la consciencia de tu bóveda.
						</h3>
						<p className="text-sm text-slate-400 max-w-sm">
							Conozco todas tus notas. Hazme cualquier pregunta, pídeme que
							resuma temas o que te ayude a encontrar conexiones entre tus
							ideas.
						</p>
					</div>
				) : (
					chatHistory.map((msg) => (
						<ChatBubble
							key={msg.id}
							role={msg.role}
							text={msg.text}
							flavor="aether"
						/>
					))
				)}

				{isLoading(status) && <ChatSkeleton flavor="aether" />}
				<div ref={messagesEndRef} />
			</div>

			{/* Input Area */}
			<div>
				<ChatInputArea
					prompt={prompt}
					setPrompt={setPrompt}
					onSubmit={handleSendMessage}
					isLoading={isLoading(status)}
					disabledMsg="Pregúntale a tu segundo cerebro..."
					flavor="aether"
				/>
				<div className="text-center pb-2 bg-navy-950/50">
					<button
						onClick={() => setGeminiApiKey("")}
						className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors"
					>
						[Desvincular API Key]
					</button>
				</div>
			</div>
		</div>
	);
}
