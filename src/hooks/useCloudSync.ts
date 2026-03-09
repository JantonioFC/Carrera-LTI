import type { User } from "firebase/auth";
import { useEffect, useState } from "react";
import type { PresencialEvent } from "../data/lti";
import {
	type AppData,
	getDataFromCloud,
	initAuth,
	syncDataToCloud,
} from "../utils/firebase";
import { type SubjectData, useSubjectData } from "./useSubjectData";

export function useCloudSync(
	presenciales: PresencialEvent[],
	setPresenciales: (events: PresencialEvent[]) => void,
) {
	const { data: subjectData, updateSubject } = useSubjectData();
	const [userId, setUserId] = useState<string | null>(null);
	const [syncStatus, setSyncStatus] = useState<
		"idle" | "syncing" | "success" | "error"
	>("idle");

	// Inicializar auth
	useEffect(() => {
		initAuth((user: User | null) => {
			if (user) {
				setUserId(user.uid);
			}
		});
	}, []);

	// Procesar cola en segundo plano cuando vuelva la conexión
	useEffect(() => {
		const handleOnline = () => {
			const queuedData = localStorage.getItem("lti_sync_queue");
			if (queuedData && userId) {
				try {
					const parsed = JSON.parse(queuedData) as AppData;
					setSyncStatus("syncing");
					syncDataToCloud(userId, parsed).then((success) => {
						if (success) {
							localStorage.removeItem("lti_sync_queue");
							setSyncStatus("success");
							setTimeout(() => setSyncStatus("idle"), 3000);
						} else {
							setSyncStatus("error");
						}
					});
				} catch (e) {
					console.error(e);
				}
			}
		};

		window.addEventListener("online", handleOnline);
		return () => window.removeEventListener("online", handleOnline);
	}, [userId]);

	// Función para forzar sincronización manual o background
	const syncNow = async () => {
		if (!userId) return;

		const appData: AppData = {
			subjectData,
			presenciales,
			lastUpdated: Date.now(),
		};

		// Si estamos offline o el sync inmediato falla, encolamos
		if (!navigator.onLine) {
			localStorage.setItem("lti_sync_queue", JSON.stringify(appData));
			return;
		}

		try {
			setSyncStatus("syncing");
			const success = await syncDataToCloud(userId, appData);

			if (success) {
				localStorage.removeItem("lti_sync_queue");
				setSyncStatus("success");
				setTimeout(() => setSyncStatus("idle"), 3000);
			} else {
				// Fallback
				localStorage.setItem("lti_sync_queue", JSON.stringify(appData));
				setSyncStatus("error");
			}
		} catch (error) {
			console.error("Error syncing to cloud:", error);
			localStorage.setItem("lti_sync_queue", JSON.stringify(appData));
			setSyncStatus("error");
		}
	};

	// Función para restaurar datos desde la nube (backup)
	const restoreFromCloud = async () => {
		if (!userId) return;
		setSyncStatus("syncing");

		try {
			const remoteData = await getDataFromCloud(userId);
			if (remoteData) {
				// Restore subjects
				if (remoteData.subjectData) {
					Object.entries(remoteData.subjectData).forEach(([id, data]) => {
						updateSubject(id, data as Partial<SubjectData>);
					});
				}

				// Restore presenciales
				if (remoteData.presenciales) {
					setPresenciales(remoteData.presenciales);
				}

				setSyncStatus("success");
				setTimeout(() => setSyncStatus("idle"), 3000);
			} else {
				setSyncStatus("error");
			}
		} catch (error) {
			console.error("Error restoring from cloud:", error);
			setSyncStatus("error");
		}
	};

	return {
		syncNow,
		restoreFromCloud,
		syncStatus,
		userId,
		isConfigured: !!userId, // Si firebase está bien configurado y hay usuario anónimo
	};
}
