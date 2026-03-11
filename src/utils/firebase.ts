import { initializeApp } from "firebase/app";
import {
	signInAnonymously as firebaseSignInAnonymously,
	getAuth,
	onAuthStateChanged,
	type User,
} from "firebase/auth";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import type { PresencialEvent } from "../data/lti";
import type { SubjectDataMap } from "../hooks/useSubjectData";
import type { ScheduleItem } from "../pages/Horarios";
import type { Task } from "../pages/Tareas";
import type { IAuthService, ISyncService } from "../services/types";
import type { AetherNote } from "../store/aetherStore";
import type { NexusDocument } from "../store/nexusStore";

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app: any;
let auth: any;
let db: any;

try {
	app = initializeApp(firebaseConfig);
	auth = getAuth(app);
	db = getFirestore(app);
} catch (error) {
	console.warn("Firebase initialization failed:", error);
}

export type AppData = {
	subjectData: SubjectDataMap;
	presenciales: PresencialEvent[];
	calendarEvents?: Record<string, any[]>;
	tasks?: Task[];
	schedule?: ScheduleItem[];
	nexusDocs?: NexusDocument[];
	aetherNotes?: AetherNote[];
	geminiApiKey?: string;
	gmailClientId?: string;
	gmailApiKey?: string;
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
			console.error("Anonymous sign-in failed:", error);
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
			// Phase 3: Zod validation point (simplifying for now, can add full AppData schema)
			const userRef = doc(db, "users", userId);
			await setDoc(
				userRef,
				{ ...data, lastUpdated: Date.now() },
				{ merge: true },
			);
			return true;
		} catch (error) {
			console.error("Cloud sync failed:", error);
			return false;
		}
	}

	async getFromCloud(userId: string): Promise<AppData | null> {
		if (!db) return null;
		try {
			const userRef = doc(db, "users", userId);
			const snap = await getDoc(userRef);
			if (snap.exists()) {
				const data = snap.data() as AppData;
				// Phase 3: Zod validation point here
				return data;
			}
		} catch (error) {
			console.error("Failed to get data from cloud:", error);
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
