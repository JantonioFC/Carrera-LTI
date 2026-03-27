import { AnimatePresence, motion } from "framer-motion";
import {
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Cloud,
	Key,
	X,
} from "lucide-react";
import { useState } from "react";

interface Step {
	title: string;
	description: string;
	items: string[];
	imageDesc?: string;
}

const STEPS: Step[] = [
	{
		title: "Fase I: Constitución del Proyecto",
		description:
			"Crea tu proyecto en Google Cloud Console para habilitar las APIs.",
		items: [
			"Ve a console.cloud.google.com",
			"Crea un 'Nuevo Proyecto' con el nombre 'Carrera LTI'",
			"Habilita la 'Gmail API' desde la biblioteca de APIs",
		],
		imageDesc: "Botón 'New Project' en la cabecera azul de Google Cloud.",
	},
	{
		title: "Fase II: Pantalla de Consentimiento",
		description: "Configura qué datos podrá ver la aplicación.",
		items: [
			"Configura el 'OAuth Consent Screen'",
			"Elige tipo de usuario 'Externo'",
			"Agrega los ámbitos (Scopes): ../auth/gmail.readonly",
		],
		imageDesc: "Sección 'External' en la configuración de OAuth.",
	},
	{
		title: "Fase III: Credenciales OAuth",
		description: "Genera el Client ID para la autenticación.",
		items: [
			"Crea 'Credenciales' -> 'ID de cliente de OAuth'",
			"Tipo de aplicación: 'Web'",
			"Agrega http://localhost:5173 a los Orígenes Autorizados",
		],
		imageDesc: "Campos de 'Authorized JavaScript origins'.",
	},
	{
		title: "Fase IV: API Key de Gemini",
		description: "Obtén tu llave para las capacidades de IA.",
		items: [
			"Ve a aistudio.google.com",
			"Crea una nueva API Key",
			"Cópiala y guárdala para el paso final",
		],
		imageDesc: "Panel 'Get API Key' en Google AI Studio.",
	},
];

export function AssistantGuide({ onClose }: { onClose: () => void }) {
	const [currentStep, setCurrentStep] = useState(0);
	const currentStepData = STEPS[currentStep]!;

	return (
		<motion.div
			initial={{ opacity: 0, x: 20 }}
			animate={{ opacity: 1, x: 0 }}
			exit={{ opacity: 0, x: 20 }}
			className="fixed inset-y-0 right-0 w-96 bg-navy-950 border-l border-navy-700 shadow-2xl z-[200] flex flex-col"
		>
			<div className="p-4 border-b border-navy-800 flex items-center justify-between bg-navy-900/50">
				<div className="flex items-center gap-2">
					<Cloud className="text-lti-blue" size={18} />
					<h2 className="text-white font-bold text-sm uppercase tracking-tighter">
						The Guide: Configuración
					</h2>
				</div>
				<button
					onClick={onClose}
					className="p-1 hover:bg-navy-800 rounded-lg text-slate-400"
				>
					<X size={16} />
				</button>
			</div>

			<div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
				{/* Progress Bar */}
				<div className="flex gap-1">
					{STEPS.map((_, i) => (
						<div
							key={i}
							className={`h-1 flex-1 rounded-full transition-all duration-300 ${
								i <= currentStep ? "bg-lti-blue" : "bg-navy-800"
							}`}
						/>
					))}
				</div>

				<AnimatePresence mode="wait">
					<motion.div
						key={currentStep}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className="space-y-4"
					>
						<div className="space-y-1">
							<p className="text-[10px] text-lti-blue font-bold uppercase tracking-widest">
								Paso {currentStep + 1} de {STEPS.length}
							</p>
							<h3 className="text-white font-bold text-lg leading-tight">
								{currentStepData.title}
							</h3>
						</div>

						<p className="text-sm text-slate-400 leading-relaxed italic">
							{currentStepData.description}
						</p>

						<div className="bg-navy-900/50 rounded-xl p-4 border border-navy-800 space-y-3">
							{currentStepData.items.map((item, i) => (
								<div key={i} className="flex gap-3">
									<div className="w-5 h-5 rounded-full bg-lti-blue/10 border border-lti-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5">
										<span className="text-lti-blue text-[10px] font-bold">
											{i + 1}
										</span>
									</div>
									<p className="text-xs text-slate-300 leading-relaxed">
										{item}
									</p>
								</div>
							))}
						</div>

						{currentStepData.imageDesc && (
							<div className="bg-navy-900 p-3 rounded-lg border border-dashed border-navy-700 flex items-center gap-3">
								<div className="p-2 bg-navy-800 rounded">
									<Key size={14} className="text-slate-500" />
								</div>
								<p className="text-[10px] text-slate-500 font-medium">
									TIP VISUAL: {currentStepData.imageDesc}
								</p>
							</div>
						)}
					</motion.div>
				</AnimatePresence>
			</div>

			<div className="p-6 border-t border-navy-800 bg-navy-900/20 flex gap-3">
				<button
					onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
					disabled={currentStep === 0}
					className="flex-1 py-3 bg-navy-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-navy-700 disabled:opacity-30 flex items-center justify-center gap-2"
				>
					<ChevronLeft size={16} /> Anterior
				</button>
				{currentStep === STEPS.length - 1 ? (
					<button
						onClick={onClose}
						className="flex-[2] py-3 gradient-blue text-white text-xs font-bold rounded-xl shadow-lg shadow-lti-blue/20 flex items-center justify-center gap-2"
					>
						<CheckCircle2 size={16} /> Finalizar Guía
					</button>
				) : (
					<button
						onClick={() =>
							setCurrentStep((prev) => Math.min(STEPS.length - 1, prev + 1))
						}
						className="flex-[2] py-3 bg-white text-navy-950 text-xs font-bold rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2"
					>
						Siguiente <ChevronRight size={16} />
					</button>
				)}
			</div>
		</motion.div>
	);
}
