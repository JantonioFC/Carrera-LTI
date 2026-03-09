import { Bot } from "lucide-react";

interface ChatSkeletonProps {
	flavor?: "aether" | "nexus";
}

export function ChatSkeleton({ flavor = "aether" }: ChatSkeletonProps) {
	const isAether = flavor === "aether";

	const botIconContainer = isAether
		? "w-8 h-8 rounded-full bg-lti-coral/20 flex flex-shrink-0 items-center justify-center self-end"
		: "w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow";

	const botIconColor = isAether ? "text-lti-coral" : "text-white";

	const bubbleClass = isAether
		? "bg-navy-800 border border-navy-700 text-slate-200 rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-2"
		: "bg-navy-800 border border-navy-700 text-slate-200 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2";

	const dotClass = isAether ? "bg-slate-400" : "bg-purple-400";

	return (
		<div className="flex gap-4 justify-start">
			<div className={botIconContainer}>
				<Bot size={16} className={botIconColor} />
			</div>
			<div className={bubbleClass}>
				<div
					className={`w-2 h-2 ${dotClass} rounded-full animate-bounce [animation-delay:-0.3s]`}
				></div>
				<div
					className={`w-2 h-2 ${dotClass} rounded-full animate-bounce [animation-delay:-0.15s]`}
				></div>
				<div
					className={`w-2 h-2 ${dotClass} rounded-full animate-bounce`}
				></div>
			</div>
		</div>
	);
}
