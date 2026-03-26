import { useCallback, useEffect, useState } from "react";
import { type GmailMessage, gmailService } from "../../services/gmail";
import { useUserConfigStore } from "../../store/userConfigStore";
import { logger } from "../../utils/logger";
import { GmailInbox } from "./GmailInbox";
import { GmailMinimized } from "./GmailMinimized";
import { GmailSettingsPanel } from "./GmailSettingsPanel";

export function GmailWidget() {
	const { gmailClientId, gmailApiKey, setGmailClientId, setGmailApiKey } =
		useUserConfigStore();
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
			<GmailSettingsPanel
				gmailClientId={gmailClientId ?? ""}
				gmailApiKey={gmailApiKey ?? ""}
				onClientIdChange={setGmailClientId}
				onApiKeyChange={setGmailApiKey}
				onClose={() => setShowSettings(false)}
				showGuide={showGuide}
				onShowGuide={() => setShowGuide(true)}
				onCloseGuide={() => setShowGuide(false)}
			/>
		);
	}

	// --- Render Minimized or Silent ---
	if (isMinimized || !gmailClientId || !gmailApiKey) {
		const isSilent = !gmailClientId || !gmailApiKey;
		return (
			<GmailMinimized
				isSilent={isSilent}
				messageCount={messages.length}
				onExpand={() => setIsMinimized(false)}
				onConfigOpen={() => setShowSettings(true)}
			/>
		);
	}

	// --- Render Full Window ---
	return (
		<GmailInbox
			messages={messages}
			loading={loading}
			error={error}
			isAuthenticated={isAuthenticated}
			onLogin={handleLogin}
			onRefresh={fetchEmails}
			onSignOut={handleSignOut}
			onSettingsOpen={() => setShowSettings(true)}
			onMinimize={() => setIsMinimized(true)}
		/>
	);
}
