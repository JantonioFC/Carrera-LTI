import { useEffect, useState } from "react";
import type { PresencialEvent } from "../data/lti";
import { type AppData, authService, syncService } from "../utils/firebase";
import { AppDataSchema } from "../utils/schemas";
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

	// Inicializar auth usando el servicio desacoplado
	useEffect(() => {
		authService.init((uid: string | null) => {
			if (uid) {
				setUserId(uid);
			}
		});
	}, []);

	// Procesar cola en segundo plano cuando vuelva la conexión
	useEffect(() => {
		const handleOnline = async () => {
			const queuedData = localStorage.getItem("lti_sync_queue");
			if (queuedData && userId) {
				try {
					const rawData = JSON.parse(queuedData);

					// Validación con Zod antes de subir a la nube (ADR-002)
					const validation = AppDataSchema.safeParse(rawData);
					if (!validation.success) {
						console.error("Invalid queued data schema:", validation.error);
						return;
					}

					setSyncStatus("syncing");
					const success = await syncService.syncToCloud(
						userId,
						validation.data,
					);
					if (success) {
						localStorage.removeItem("lti_sync_queue");
						setSyncStatus("success");
						setTimeout(() => setSyncStatus("idle"), 3000);
					} else {
						setSyncStatus("error");
					}
				} catch (e) {
					console.error("Online sync handler failed:", e);
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

		// Validación antes de encolar o enviar
		const validation = AppDataSchema.safeParse(appData);
		if (!validation.success) {
			console.error("Failed to validate AppData for sync:", validation.error);
			setSyncStatus("error");
			return;
		}

		// Si estamos offline o el sync inmediato falla, encolamos
		if (!navigator.onLine) {
			localStorage.setItem("lti_sync_queue", JSON.stringify(validation.data));
			return;
		}

		try {
			setSyncStatus("syncing");
			const success = await syncService.syncToCloud(userId, validation.data);

			if (success) {
				localStorage.removeItem("lti_sync_queue");
				setSyncStatus("success");
				setTimeout(() => setSyncStatus("idle"), 3000);
			} else {
				localStorage.setItem("lti_sync_queue", JSON.stringify(validation.data));
				setSyncStatus("error");
			}
		} catch (error) {
			console.error("Error syncing to cloud:", error);
			localStorage.setItem("lti_sync_queue", JSON.stringify(validation.data));
			setSyncStatus("error");
		}
	};

	// Función para restaurar datos desde la nube (backup)
	const restoreFromCloud = async () => {
		if (!userId) return;
		setSyncStatus("syncing");

		try {
			const remoteData = await syncService.getFromCloud(userId);
			if (remoteData) {
				// Validación de datos remotos (ADR-002)
				const validation = AppDataSchema.safeParse(remoteData);
				if (!validation.success) {
					console.error("Remote data failed validation:", validation.error);
					setSyncStatus("error");
					return;
				}

				const validatedData = validation.data;

				// Restore subjects
				if (validatedData.subjectData) {
					Object.entries(validatedData.subjectData).forEach(([id, data]) => {
						updateSubject(id, data as any);
					});
				}

				// Restore presenciales
				if (validatedData.presenciales) {
					setPresenciales(validatedData.presenciales as PresencialEvent[]);
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
		isConfigured: !!userId,
	};
}
