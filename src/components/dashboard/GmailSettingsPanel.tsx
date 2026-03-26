import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Settings } from "lucide-react";
import { AssistantGuide } from "../AssistantGuide";

interface GmailSettingsPanelProps {
	gmailClientId: string;
	gmailApiKey: string;
	onClientIdChange: (v: string) => void;
	onApiKeyChange: (v: string) => void;
	onClose: () => void;
	showGuide: boolean;
	onShowGuide: () => void;
	onCloseGuide: () => void;
}

export function GmailSettingsPanel({
	gmailClientId,
	gmailApiKey,
	onClientIdChange,
	onApiKeyChange,
	onClose,
	showGuide,
	onShowGuide,
	onCloseGuide,
}: GmailSettingsPanelProps) {
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
						onClick={onClose}
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
							onClick={onShowGuide}
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
								onChange={(e) => onClientIdChange(e.target.value)}
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
								onChange={(e) => onApiKeyChange(e.target.value)}
								className="w-full bg-navy-900 border border-navy-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lti-blue"
								placeholder="AIza..."
							/>
						</div>
					</div>
					<button
						onClick={onClose}
						disabled={!gmailClientId || !gmailApiKey}
						className="w-full py-2 bg-lti-blue text-white text-xs font-bold rounded-lg transition-colors border-none cursor-pointer"
					>
						Guardar y Cerrar
					</button>
				</div>
			</motion.div>

			<AnimatePresence>
				{showGuide && <AssistantGuide onClose={onCloseGuide} />}
			</AnimatePresence>
		</>
	);
}
