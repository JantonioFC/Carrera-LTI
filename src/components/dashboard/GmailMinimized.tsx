import { motion } from "framer-motion";
import { Mail } from "lucide-react";

interface GmailMinimizedProps {
	isSilent: boolean;
	messageCount: number;
	onExpand: () => void;
	onConfigOpen: () => void;
}

export function GmailMinimized({
	isSilent,
	messageCount,
	onExpand,
	onConfigOpen,
}: GmailMinimizedProps) {
	return (
		<motion.button
			layoutId="gmail-widget"
			onClick={() => (isSilent ? onConfigOpen() : onExpand())}
			className={`fixed bottom-6 right-6 z-[100] w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-95 group ${
				isSilent
					? "bg-slate-800 opacity-60 border border-slate-700"
					: "bg-lti-blue"
			}`}
		>
			<Mail size={20} className={isSilent ? "text-slate-400" : "text-white"} />
			{messageCount > 0 && !isSilent && (
				<span className="absolute -top-1 -right-1 w-5 h-5 bg-lti-coral text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-navy-950">
					{messageCount}
				</span>
			)}
			{/* Tooltip on hover */}
			<span className="absolute right-14 bg-navy-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-navy-700">
				{isSilent
					? "Conectividad Potencial (Configura Gmail)"
					: `${messageCount} correos nuevos`}
			</span>
		</motion.button>
	);
}
