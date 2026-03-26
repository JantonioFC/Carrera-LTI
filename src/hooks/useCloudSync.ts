import { useEffect, useRef, useState } from "react";
import type { PresencialEvent } from "../data/lti";
import type { ScheduleItem } from "../pages/Horarios";
import type { Task } from "../pages/Tareas";
import { useAetherStore } from "../store/aetherStore";
import { useNexusStore } from "../store/nexusStore";
import { useUserConfigStore } from "../store/userConfigStore";
import { type AppData, authService, syncService } from "../utils/firebase";
import { logger } from "../utils/logger";
import { AppDataSchema, type CalendarEventsMap } from "../utils/schemas";
import { type SubjectData, useSubjectData } from "./useSubjectData";

export function useCloudSync(
	presenciales: PresencialEvent[],
	setPresenciales: (events: PresencialEvent[]) => void,
	calendarEvents: CalendarEventsMap,
	setCalendarEvents: (events: CalendarEventsMap) => void,
	tasks: Task[],
	setTasks: (tasks: Task[]) => void,
	schedule: ScheduleItem[],
	setSchedule: (schedule: ScheduleItem[]) => void,
) {
	const { data: subjectData, updateSubject } = useSubjectData();
	const [userId, setUserId] = useState<string | null>(null);
	const [syncStatus, setSyncStatus] = useState<
		"idle" | "syncing" | "success" | "error"
	>("idle");
	// QP-01 (#225): ref para cancelar el timeout de reset en desmonte del componente
	const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (idleTimerRef.current !== null) {
				clearTimeout(idleTimerRef.current);
			}
		};
	}, []);

	const { notes: aetherNotes } = useAetherStore();
	const {
		geminiApiKey,
		setGeminiApiKey,
		gmailClientId,
		gmailApiKey,
		setGmailClientId,
		setGmailApiKey,
	} = useUserConfigStore();
	const { documents: nexusDocs } = useNexusStore();

	// Inicializar auth usando el servicio desacoplado
	useEffect(() => {
		authService.init(async (uid: string | null) => {
			if (uid) {
				setUserId(uid);
			} else {
				// Intentar login anónimo automático para habilitar la nube
				const newUid = await authService.signInAnonymously();
				if (newUid) {
					setUserId(newUid);
				}
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
						logger.error(
							"useCloudSync",
							"Invalid queued data schema",
							validation.error,
						);
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
						idleTimerRef.current = setTimeout(
							() => setSyncStatus("idle"),
							3000,
						);
					} else {
						setSyncStatus("error");
					}
				} catch (e) {
					logger.error("useCloudSync", "Online sync handler failed", e);
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
			calendarEvents,
			tasks,
			schedule,
			nexusDocs,
			aetherNotes,
			geminiApiKey,
			gmailClientId,
			gmailApiKey,
			lastUpdated: Date.now(),
		};

		// Validación antes de encolar o enviar
		const validation = AppDataSchema.safeParse(appData);
		if (!validation.success) {
			logger.error(
				"useCloudSync",
				"Failed to validate AppData for sync",
				validation.error,
			);
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
				idleTimerRef.current = setTimeout(() => setSyncStatus("idle"), 3000);
			} else {
				localStorage.setItem("lti_sync_queue", JSON.stringify(validation.data));
				setSyncStatus("error");
			}
		} catch (error) {
			logger.error("useCloudSync", "Error syncing to cloud", error);
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
					logger.error(
						"useCloudSync",
						"Remote data failed validation",
						validation.error,
					);
					setSyncStatus("error");
					return;
				}

				const validatedData = validation.data;

				// Restore subjects
				if (validatedData.subjectData) {
					Object.entries(validatedData.subjectData).forEach(([id, data]) => {
						updateSubject(id, data as Partial<SubjectData>); // QP-07 (#203)
					});
				}

				// Restore presenciales
				if (validatedData.presenciales) {
					setPresenciales(validatedData.presenciales as PresencialEvent[]);
				}

				// Restore calendar events
				if (validatedData.calendarEvents) {
					setCalendarEvents(validatedData.calendarEvents);
				}

				// Restore tasks
				if (validatedData.tasks) {
					setTasks(validatedData.tasks);
				}

				// Restore schedule
				if (validatedData.schedule) {
					setSchedule(validatedData.schedule);
				}

				// Restore API Keys
				if (validatedData.geminiApiKey) {
					setGeminiApiKey(validatedData.geminiApiKey);
				}
				if (validatedData.gmailClientId) {
					setGmailClientId(validatedData.gmailClientId);
				}
				if (validatedData.gmailApiKey) {
					setGmailApiKey(validatedData.gmailApiKey);
				}

				// Restore Aether Notes
				if (validatedData.aetherNotes) {
					useAetherStore.setState({ notes: [...validatedData.aetherNotes] });
				}

				// Restore Nexus Docs
				if (validatedData.nexusDocs) {
					useNexusStore.setState({ documents: [...validatedData.nexusDocs] });
				}

				setSyncStatus("success");
				idleTimerRef.current = setTimeout(() => setSyncStatus("idle"), 3000);
			} else {
				setSyncStatus("error");
			}
		} catch (error) {
			logger.error("useCloudSync", "Error restoring from cloud", error);
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
