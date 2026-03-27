import { type FirebaseApp, initializeApp } from "firebase/app";
import {
	type Auth,
	signInAnonymously as firebaseSignInAnonymously,
	getAuth,
	onAuthStateChanged,
	type User,
} from "firebase/auth";
import {
	doc,
	type Firestore,
	getDoc,
	getFirestore,
	setDoc,
} from "firebase/firestore";
import type { PresencialEvent } from "../data/lti";
import type { SubjectDataMap } from "../hooks/useSubjectData";
import type { ScheduleItem } from "../pages/Horarios";
import type { Task } from "../pages/Tareas";
import type { IAuthService, ISyncService } from "../services/types";
import type { AetherNote } from "../store/aetherStore";
import type { NexusDocument } from "../store/nexusStore";
import { logger } from "./logger";
import { AppDataSchema, type CalendarEventsMap } from "./schemas";

// Guard: solo inicializar Firebase si la clave API y el proyecto están configurados.
// Las variables VITE_* se sustituyen en tiempo de compilación por Vite; si no están
// presentes en .env, el bundle no contendrá credenciales reales. (#174)
const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;

const hasFirebaseConfig = !!(FIREBASE_API_KEY && FIREBASE_PROJECT_ID);

const firebaseConfig = {
	apiKey: FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (hasFirebaseConfig) {
	try {
		app = initializeApp(firebaseConfig);
		auth = getAuth(app);
		db = getFirestore(app);
	} catch (error) {
		logger.warn("Firebase", "initialization failed", error);
	}
} else {
	logger.warn(
		"Firebase",
		"VITE_FIREBASE_API_KEY no configurada — Firebase deshabilitado",
	);
}

// SC-02 (#256): API keys eliminadas de AppData — nunca se sincronizan a la nube.
// Viven exclusivamente en userConfigStore (OS Keychain vía cortexAPI).
export type AppData = {
	subjectData: SubjectDataMap;
	presenciales: PresencialEvent[];
	calendarEvents?: CalendarEventsMap;
	tasks?: Task[];
	schedule?: ScheduleItem[];
	nexusDocs?: NexusDocument[];
	aetherNotes?: AetherNote[];
	lastUpdated: number;
};

class FirebaseAuthService implements IAuthService {
	init(onUser: (uid: string | null) => void) {
		if (!auth) return;
		onAuthStateChanged(auth, (user: User | null) => {
			onUser(user ? user.uid : null);
		});
	}

	async signInAnonymously(): Promise<string | null> {
		if (!auth) return null;
		try {
			const result = await firebaseSignInAnonymously(auth);
			return result.user.uid;
		} catch (error) {
			logger.error("Firebase", "Anonymous sign-in failed", error);
			return null;
		}
	}

	getUserId(): string | null {
		return auth?.currentUser?.uid || null;
	}
}

class FirebaseSyncService implements ISyncService {
	async syncToCloud(userId: string, data: AppData): Promise<boolean> {
		if (!db) return false;
		try {
			const userRef = doc(db, "users", userId);
			// SC-02 (#256): AppData ya no contiene API keys — no se necesita sanitización
			await setDoc(
				userRef,
				{ ...data, lastUpdated: Date.now() },
				{ merge: true },
			);
			return true;
		} catch (error) {
			logger.error("Firebase", "Cloud sync failed", error);
			return false;
		}
	}

	async getFromCloud(userId: string): Promise<AppData | null> {
		if (!db) return null;
		try {
			const userRef = doc(db, "users", userId);
			const snap = await getDoc(userRef);
			if (snap.exists()) {
				// SC-10 (#211): validar estructura antes de devolver al caller
				const parsed = AppDataSchema.safeParse(snap.data());
				if (!parsed.success) {
					logger.warn(
						"Firebase",
						"Cloud data failed schema validation — discarding",
						parsed.error.issues[0]?.message,
					);
					return null;
				}
				return parsed.data as AppData;
			}
		} catch (error) {
			logger.error("Firebase", "Failed to get data from cloud", error);
		}
		return null;
	}
}

export const authService = new FirebaseAuthService();
export const syncService = new FirebaseSyncService();

// Legacy exports for compatibility (will be removed once useCloudSync is updated)
export const initAuth = authService.init.bind(authService);
export const syncDataToCloud = syncService.syncToCloud.bind(syncService);
export const getDataFromCloud = syncService.getFromCloud.bind(syncService);
