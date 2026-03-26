import { BrainCircuit, Coffee, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// #241: constantes nombradas para evitar magic numbers duplicados
const FOCUS_DURATION_SECONDS = 25 * 60;
const BREAK_DURATION_SECONDS = 5 * 60;

type TimerMode = "focus" | "break";

export default function Pomodoro() {
	const [isOpen, setIsOpen] = useState(false);
	const [mode, setMode] = useState<TimerMode>("focus");
	const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION_SECONDS);
	const [isActive, setIsActive] = useState(false);

	// #242: ref para leer mode dentro del interval sin incluirlo en las deps
	const modeRef = useRef(mode);
	modeRef.current = mode;

	useEffect(() => {
		if (!isActive) return;

		// #242: updater funcional — el interval no necesita timeLeft como
		// dependencia, evitando la recreación 60×/min por cada tick.
		const interval = setInterval(() => {
			setTimeLeft((t) => {
				if (t <= 1) {
					setIsActive(false);
					if (
						"Notification" in window &&
						Notification.permission === "granted"
					) {
						new Notification(
							modeRef.current === "focus" ? "¡Descanso!" : "¡A estudiar!",
							{
								body:
									modeRef.current === "focus"
										? "Tu sesión de estudio terminó. Tómate un descanso."
										: "El descanso terminó. A concentrarse.",
								icon: "/pwa-192x192.png",
							},
						);
					}
					return 0;
				}
				return t - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [isActive, mode]);

	const toggleTimer = () => setIsActive(!isActive);
	const resetTimer = () => {
		setIsActive(false);
		setTimeLeft(
			mode === "focus" ? FOCUS_DURATION_SECONDS : BREAK_DURATION_SECONDS,
		);
	};
	const switchMode = (m: TimerMode) => {
		setMode(m);
		setIsActive(false);
		setTimeLeft(
			m === "focus" ? FOCUS_DURATION_SECONDS : BREAK_DURATION_SECONDS,
		);
	};

	const formatTime = (seconds: number) => {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
	};

	if (!isOpen) {
		return (
			<button
				onClick={() => setIsOpen(true)}
				className="fixed bottom-6 right-20 w-12 h-12 rounded-full gradient-blue text-white shadow-xl shadow-lti-blue/20 hover:scale-110 transition-transform animate-fade-in z-[150] flex items-center justify-center group"
			>
				<BrainCircuit size={24} />
				{isActive && (
					<span className="absolute -top-1 -right-1 flex h-3 w-3">
						<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lti-coral opacity-75"></span>
						<span className="relative inline-flex rounded-full h-3 w-3 bg-lti-coral border border-navy-900"></span>
					</span>
				)}
			</button>
		);
	}

	return (
		<div className="fixed bottom-6 right-[380px] w-80 bg-navy-800 rounded-2xl border border-navy-600 shadow-2xl z-[150] overflow-hidden animate-fade-in">
			<div className="p-4 border-b border-navy-700/50 flex justify-between items-center bg-navy-900/50">
				<div className="flex items-center gap-2">
					{mode === "focus" ? (
						<BrainCircuit size={16} className="text-lti-blue" />
					) : (
						<Coffee size={16} className="text-lti-coral" />
					)}
					<h3 className="text-white font-semibold text-sm">
						Temporizador Pomodoro
					</h3>
				</div>
				<button
					onClick={() => setIsOpen(false)}
					className="text-slate-400 hover:text-white text-lg leading-none cursor-pointer"
				>
					×
				</button>
			</div>

			<div className="p-5 flex flex-col items-center">
				{/* Mode Switcher */}
				<div className="flex gap-1 p-1 bg-navy-900 rounded-lg mb-6 w-full">
					<button
						onClick={() => switchMode("focus")}
						className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${mode === "focus" ? "bg-navy-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
					>
						Concentración
					</button>
					<button
						onClick={() => switchMode("break")}
						className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${mode === "break" ? "bg-navy-700 text-white" : "text-slate-400 hover:text-slate-200"}`}
					>
						Descanso
					</button>
				</div>

				{/* Timer Display */}
				<div className="text-6xl font-bold font-mono tracking-wider text-white mb-6">
					{formatTime(timeLeft)}
				</div>

				{/* Controls */}
				<div className="flex items-center gap-4">
					<button
						onClick={resetTimer}
						className="p-3 text-slate-400 bg-navy-900 border border-navy-600 hover:text-white rounded-full transition-colors"
						title="Reiniciar"
					>
						<RotateCcw size={18} />
					</button>

					<button
						onClick={toggleTimer}
						className={`p-4 rounded-full text-white shadow-lg transition-transform hover:scale-105 ${isActive ? "bg-lti-coral hover:bg-lti-coral/90" : "gradient-blue"}`}
					>
						{isActive ? (
							<Pause size={24} className="fill-current" />
						) : (
							<Play size={24} className="fill-current" />
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
