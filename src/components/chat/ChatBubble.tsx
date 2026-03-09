import MDEditor from "@uiw/react-md-editor";
import { Bot, User } from "lucide-react";
import rehypeSanitize from "rehype-sanitize";

interface ChatBubbleProps {
	role: "user" | "model";
	text: string;
	flavor?: "aether" | "nexus";
}

export function ChatBubble({ role, text, flavor = "aether" }: ChatBubbleProps) {
	const isAether = flavor === "aether";

	const botIconContainer = isAether
		? "w-8 h-8 rounded-full bg-lti-coral/20 flex flex-shrink-0 items-center justify-center self-end"
		: "w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex flex-shrink-0 items-center justify-center self-end mt-1 shadow";

	const userIconContainer = isAether
		? "w-8 h-8 rounded-full bg-slate-700 flex flex-shrink-0 items-center justify-center self-end"
		: "w-8 h-8 rounded-lg bg-lti-blue/20 flex flex-shrink-0 items-center justify-center self-end mt-1";

	const botIconColor = isAether ? "text-lti-coral" : "text-white";
	const userIconColor = isAether ? "text-slate-300" : "text-lti-blue";

	const botBubbleStyle = isAether
		? "bg-navy-800 border border-navy-700 text-slate-200 rounded-bl-sm markdown-body-override"
		: "bg-navy-800 border border-navy-700 text-slate-200 rounded-bl-md";

	const userBubbleStyle = isAether
		? "bg-lti-blue text-white rounded-br-sm"
		: "bg-lti-blue text-white rounded-br-md";

	return (
		<div
			className={`flex gap-4 ${role === "user" ? "justify-end" : "justify-start"}`}
		>
			{role === "model" && (
				<div className={botIconContainer}>
					<Bot size={16} className={botIconColor} />
				</div>
			)}
			<div
				className={`max-w-[85%] px-5 py-4 ${isAether ? "rounded-2xl" : "rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"} ${role === "user" ? userBubbleStyle : botBubbleStyle}`}
			>
				{role === "user" ? (
					<p className="whitespace-pre-wrap">{text}</p>
				) : (
					<div className="aether-chat-markdown">
						<MDEditor.Markdown
							source={text}
							style={{
								backgroundColor: "transparent",
								color: "inherit",
							}}
							rehypePlugins={[[rehypeSanitize]]}
						/>
					</div>
				)}
			</div>
			{role === "user" && (
				<div className={userIconContainer}>
					<User size={16} className={userIconColor} />
				</div>
			)}
		</div>
	);
}
