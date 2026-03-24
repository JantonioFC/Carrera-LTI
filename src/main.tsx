import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { SubjectDataProvider } from "./hooks/useSubjectData.tsx";
import { logger } from "./utils/logger";

// Stub for Sentry Error Tracking (Phase 3C #31)
if (import.meta.env.PROD) {
	logger.info(
		"App",
		"[Sentry] Init stub: Sentry would be initialized here with valid DSN.",
	);
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<SubjectDataProvider>
				<App />
			</SubjectDataProvider>
		</BrowserRouter>
	</StrictMode>,
);
