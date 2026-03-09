import { Send } from "lucide-react";

interface ChatInputAreaProps {
	prompt: string;
	setPrompt: (v: string) => void;
	onSubmit: (e: React.FormEvent) => void;
	isLoading: boolean;
	disabledMsg?: string;
	flavor?: "aether" | "nexus";
}

export function ChatInputArea({
	prompt,
	setPrompt,
	onSubmit,
	isLoading,
	disabledMsg = "Configura tu API Key primero...",
	flavor = "aether"
}: ChatInputAreaProps) {
	const isAether = flavor === "aether";

	const wrapperClass = isAether
		? "p-4 bg-navy-950/50 border-t border-navy-700/50"
		: "px-6 py-4 border-t border-navy-700/50 bg-navy-900/80 backdrop-blur-sm";

	const inputClass = isAether
		? "w-full bg-navy-900 border border-navy-700 text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-lti-blue focus:ring-1 focus:ring-lti-blue transition-all"
		: "flex-1 bg-navy-800 border border-navy-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50";

	const buttonClass = isAether
		? "absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-lti-blue disabled:opacity-50 disabled:hover:text-slate-400 transition-colors"
		: "p-3 bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg";

	return (
		<div className={wrapperClass}>
			<form
				onSubmit={onSubmit}
				className={isAether ? "max-w-4xl mx-auto relative" : "flex items-center gap-3"}
			>
				<input
					type="text"
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					placeholder={disabledMsg}
					className={inputClass}
					disabled={isLoading}
				/>
				<button
					type={isAether ? "submit" : "button"}
					onClick={isAether ? undefined : onSubmit}
					disabled={!prompt.trim() || isLoading}
					className={buttonClass}
				>
					<Send size={isAether ? 20 : 18} />
				</button>
			</form>
		</div>
	);
}
