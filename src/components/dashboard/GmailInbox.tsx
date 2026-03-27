import { motion } from "framer-motion";
import {
	AlertCircle,
	ExternalLink,
	LogIn,
	Mail,
	Minus,
	RefreshCw,
	Settings,
} from "lucide-react";
import type { GmailMessage } from "../../services/gmail";

interface GmailInboxProps {
	messages: GmailMessage[];
	loading: boolean;
	error: string | null;
	isAuthenticated: boolean;
	onLogin: () => void;
	onRefresh: () => void;
	onSignOut: () => void;
	onSettingsOpen: () => void;
	onMinimize: () => void;
}

export function GmailInbox({
	messages,
	loading,
	error,
	isAuthenticated,
	onLogin,
	onRefresh,
	onSignOut,
	onSettingsOpen,
	onMinimize,
}: GmailInboxProps) {
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
							onClick={onRefresh}
							disabled={loading}
							className="p-1.5 text-slate-400 hover:text-white hover:bg-navy-800 rounded-md transition-all"
						>
							<RefreshCw size={14} className={loading ? "animate-spin" : ""} />
						</button>
					)}
					<button
						onClick={onSettingsOpen}
						className="p-1.5 text-slate-400 hover:text-white hover:bg-navy-800 rounded-md transition-all"
					>
						<Settings size={14} />
					</button>
					<button
						onClick={onMinimize}
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
							onClick={onLogin}
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
										{msg.from?.split("<")[0]!.trim()}
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
						onClick={onSignOut}
						className="text-[10px] text-slate-400 hover:text-lti-coral transition-colors"
					>
						Salir
					</button>
				</div>
			)}
		</motion.div>
	);
}
