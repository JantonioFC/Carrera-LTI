import { AnimatePresence, motion } from "framer-motion";
import {
	AlertCircle,
	ExternalLink,
	LogIn,
	Mail,
	Minus,
	RefreshCw,
	Settings,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { type GmailMessage, gmailService } from "../../services/gmail";
import { useAetherStore } from "../../store/aetherStore";
import { logger } from "../../utils/logger";
import { AssistantGuide } from "../AssistantGuide";

export function GmailWidget() {
	const { gmailClientId, gmailApiKey, setGmailClientId, setGmailApiKey } =
		useAetherStore();
	const [messages, setMessages] = useState<GmailMessage[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [isMinimized, setIsMinimized] = useState(true);
	const [showGuide, setShowGuide] = useState(false);

	const fetchEmails = useCallback(async () => {
		if (!gmailService.isAuthenticated()) {
			setIsAuthenticated(false);
			return;
		}

		setLoading(true);
		setError(null);
		try {
			const unread = await gmailService.fetchUnreadMessages();
			setMessages(unread);
			setIsAuthenticated(true);
		} catch (err) {
			logger.error("GmailWidget", "Failed to fetch emails", err);
			setError("Error al obtener correos.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (gmailClientId && gmailApiKey) {
			gmailService
				.initialize(gmailClientId, gmailApiKey)
				.then(() => {
					if (gmailService.isAuthenticated()) {
						setIsAuthenticated(true);
						fetchEmails();
					}
				})
				.catch((err) => {
					logger.error("GmailWidget", "Service init failed", err);
					setError("Error al inicializar Google.");
				});
		}
	}, [gmailClientId, gmailApiKey, fetchEmails]);

	const handleLogin = async () => {
		try {
			setLoading(true);
			await gmailService.authenticate();
			setIsAuthenticated(true);
			fetchEmails();
		} catch (err) {
			logger.error("GmailWidget", "Auth failed", err);
			setError("Autenticación fallida.");
		} finally {
			setLoading(false);
		}
	};

	const handleSignOut = () => {
		gmailService.signOut();
		setIsAuthenticated(false);
		setMessages([]);
	};

	// --- Render Settings Only if explicit ---
	if (showSettings && (!gmailClientId || !gmailApiKey)) {
		return (
			<>
				<motion.div
					layout
					className="fixed bottom-6 right-6 w-80 z-[100] card p-5 border-t-2 border-lti-coral shadow-2xl bg-navy-950"
				>
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-white font-semibold text-sm flex items-center gap-2">
							<Settings size={16} className="text-lti-coral" />
							Configurar Gmail
						</h2>
						<button
							onClick={() => setShowSettings(false)}
							className="text-xs text-slate-400 hover:text-white"
						>
							Cerrar
						</button>
					</div>
					<div className="space-y-4">
						<div className="bg-navy-900/50 p-3 rounded-lg border border-navy-800 space-y-2">
							<p className="text-[10px] text-slate-400 leading-tight">
								¿No tienes credenciales? Sigue nuestra guía paso a paso.
							</p>
							<button
								onClick={() => setShowGuide(true)}
								className="w-full py-1.5 bg-navy-800 text-lti-blue text-[10px] font-bold rounded-md hover:bg-navy-700 transition-colors flex items-center justify-center gap-2"
							>
								Inicia la Guía de Configuración <ExternalLink size={10} />
							</button>
						</div>

						<div className="space-y-3">
							<div>
								<label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">
									Client ID
								</label>
								<input
									type="text"
									value={gmailClientId || ""}
									onChange={(e) => setGmailClientId(e.target.value)}
									className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lti-blue"
									placeholder="000.apps.googleusercontent.com"
								/>
							</div>
							<div>
								<label className="block text-[10px] font-medium text-slate-500 uppercase mb-1">
									API Key
								</label>
								<input
									type="password"
									value={gmailApiKey || ""}
									onChange={(e) => setGmailApiKey(e.target.value)}
									className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lti-blue"
									placeholder="AIza..."
								/>
							</div>
						</div>
						<button
							onClick={() => setShowSettings(false)}
							disabled={!gmailClientId || !gmailApiKey}
							className="w-full py-2 bg-lti-blue text-white text-xs font-bold rounded-lg transition-colors border-none cursor-pointer"
						>
							Guardar y Cerrar
						</button>
					</div>
				</motion.div>

				<AnimatePresence>
					{showGuide && <AssistantGuide onClose={() => setShowGuide(false)} />}
				</AnimatePresence>
			</>
		);
	}

	// --- Render Minimized or Silent ---
	if (isMinimized || !gmailClientId || !gmailApiKey) {
		const isSilent = !gmailClientId || !gmailApiKey;
		return (
			<motion.button
				layoutId="gmail-widget"
				onClick={() =>
					isSilent ? setShowSettings(true) : setIsMinimized(false)
				}
				className={`fixed bottom-6 right-6 z-[100] w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-95 group ${
					isSilent
						? "bg-slate-800 opacity-60 border border-slate-700"
						: "bg-lti-blue"
				}`}
			>
				<Mail
					size={20}
					className={isSilent ? "text-slate-400" : "text-white"}
				/>
				{messages.length > 0 && !isSilent && (
					<span className="absolute -top-1 -right-1 w-5 h-5 bg-lti-coral text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-navy-950">
						{messages.length}
					</span>
				)}
				{/* Tooltip on hover */}
				<span className="absolute right-14 bg-navy-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-navy-700">
					{isSilent
						? "Conectividad Potencial (Configura Gmail)"
						: `${messages.length} correos nuevos`}
				</span>
			</motion.button>
		);
	}

	// --- Render Full Window ---
	return (
		<motion.div
			layoutId="gmail-widget"
			className="fixed bottom-6 right-6 w-80 h-[400px] z-[100] card p-5 border-t-2 border-lti-blue shadow-2xl bg-navy-950 flex flex-col"
		>
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<div className="p-1.5 bg-lti-blue/10 rounded-lg">
						<Mail size={16} className="text-lti-blue" />
					</div>
					<h2 className="text-white font-semibold text-sm">Bandeja Gmail</h2>
				</div>
				<div className="flex items-center gap-1">
					{isAuthenticated && (
						<button
							onClick={fetchEmails}
							disabled={loading}
							className="p-1.5 text-slate-400 hover:text-white hover:bg-navy-800 rounded-md transition-all"
						>
							<RefreshCw size={14} className={loading ? "animate-spin" : ""} />
						</button>
					)}
					<button
						onClick={() => setShowSettings(true)}
						className="p-1.5 text-slate-400 hover:text-white hover:bg-navy-800 rounded-md transition-all"
					>
						<Settings size={14} />
					</button>
					<button
						onClick={() => setIsMinimized(true)}
						className="p-1.5 text-slate-400 hover:text-white hover:bg-navy-800 rounded-md transition-all"
					>
						<Minus size={14} />
					</button>
				</div>
			</div>

			<div className="flex-1 flex flex-col overflow-hidden">
				{!isAuthenticated ? (
					<div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-4">
						<LogIn size={24} className="text-slate-600 mb-2" />
						<p className="text-xs text-slate-500">
							Conecta tu cuenta para monitorear correos.
						</p>
						<button
							onClick={handleLogin}
							className="px-4 py-2 bg-white text-navy-950 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
						>
							Iniciar Sesión
						</button>
					</div>
				) : error ? (
					<div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-3">
						<AlertCircle size={24} className="text-lti-coral" />
						<p className="text-xs text-slate-500 italic">{error}</p>
					</div>
				) : messages.length === 0 && !loading ? (
					<div className="flex-1 flex flex-col items-center justify-center text-center p-4 opacity-40">
						<Mail size={32} className="text-slate-600 mb-2" />
						<p className="text-xs text-slate-500 font-medium tracking-wide uppercase">
							Todo al día
						</p>
					</div>
				) : (
					<div className="space-y-2 overflow-y-auto pr-1 custom-scrollbar">
						{messages.map((msg) => (
							<a
								key={msg.id}
								href={`https://mail.google.com/mail/u/0/#inbox/${msg.threadId}`}
								target="_blank"
								rel="noopener noreferrer"
								className="group block p-2.5 rounded-lg bg-navy-900/40 border border-navy-700/30 hover:border-lti-blue/30 hover:bg-navy-900/60 transition-all"
							>
								<div className="flex justify-between items-start gap-2 mb-1">
									<p className="text-xs font-bold text-slate-200 truncate group-hover:text-lti-blue transition-colors">
										{msg.from?.split("<")[0].trim()}
									</p>
									<p className="text-[10px] text-slate-500 whitespace-nowrap">
										{msg.date
											? new Date(msg.date).toLocaleDateString([], {
													month: "short",
													day: "numeric",
												})
											: ""}
									</p>
								</div>
								<h3 className="text-[11px] font-semibold text-white line-clamp-1 mb-0.5">
									{msg.subject}
								</h3>
								<p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed italic">
									{msg.snippet}
								</p>
							</a>
						))}
					</div>
				)}
			</div>

			{isAuthenticated && (
				<div className="pt-4 mt-auto border-t border-navy-800 flex items-center justify-between">
					<a
						href="https://mail.google.com"
						target="_blank"
						rel="noopener noreferrer"
						className="text-[10px] text-lti-blue font-bold flex items-center gap-1 hover:underline"
					>
						ABRIR EN GMAIL <ExternalLink size={10} />
					</a>
					<button
						onClick={handleSignOut}
						className="text-[10px] text-slate-400 hover:text-lti-coral transition-colors"
					>
						Salir
					</button>
				</div>
			)}
		</motion.div>
	);
}
