import { initializeApp } from "firebase/app";
import {
	getAuth,
	onAuthStateChanged,
	signInAnonymously,
	type User,
} from "firebase/auth";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import type { PresencialEvent } from "../data/lti";
import type { SubjectDataMap } from "../hooks/useSubjectData";

// TODO: Replace with Real Firebase Config if you want this to work genuinely
// The user explicitly stated they want a personal free tier Google solution
// but didn't provide keys, so we setup the skeleton to use Anonymous Login
const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

try {
	app = initializeApp(firebaseConfig);
	auth = getAuth(app);
	db = getFirestore(app);
} catch (error) {
	console.warn(
		"Firebase not configured properly. Cloud sync is disabled.",
		error,
	);
}

export type AppData = {
	subjectData: SubjectDataMap;
	presenciales: PresencialEvent[];
	lastUpdated: number;
};

// Autenticación anónima silenciosa
export const initAuth = (onUser: (user: User | null) => void) => {
	if (!auth) {
		console.error(
			"Firebase auth object is undefined. Initialization likely failed.",
		);
		return;
	}
	onAuthStateChanged(auth, (user: User | null) => {
		if (user) {
			console.log("Firebase Auth: Logged in as User ID:", user.uid);
			onUser(user);
		} else {
			console.log(
				"Firebase Auth: No user found. Attempting Anonymous Sign-In...",
			);
			signInAnonymously(auth).catch((err) => {
				console.error(
					"💥 ERROR: Failed to sign in anonymously. Did you enable 'Anonymous' Sign-In Provider in Firebase Console -> Authentication -> Sign-in method?",
					err,
				);
				alert(
					"Error al conectar a la nube. ¿Habilitaste 'Anónimo' en Firebase Authentication?\n" +
						err.message,
				);
			});
		}
	});
};

export const syncDataToCloud = async (userId: string, data: AppData) => {
	if (!db) return false;
	try {
		const userRef = doc(db, "users", userId);
		await setDoc(
			userRef,
			{
				...data,
				lastUpdated: Date.now(),
			},
			{ merge: true },
		);
		return true;
	} catch (error) {
		console.error("Error al sincronizar datos:", error);
		return false;
	}
};

export const getDataFromCloud = async (
	userId: string,
): Promise<AppData | null> => {
	if (!db) return null;
	try {
		const userRef = doc(db, "users", userId);
		const snap = await getDoc(userRef);
		if (snap.exists()) {
			return snap.data() as AppData;
		}
		return null;
	} catch (error) {
		console.error("Error obteniendo datos desde la nube:", error);
		return null;
	}
};
