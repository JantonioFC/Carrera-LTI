import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, getDoc, setDoc 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, User 
} from 'firebase/auth';
import type { SubjectDataMap } from '../hooks/useSubjectData';
import type { PresencialEvent } from '../data/lti';

// TODO: Replace with Real Firebase Config if you want this to work genuinely
// The user explicitly stated they want a personal free tier Google solution
// but didn't provide keys, so we setup the skeleton to use Anonymous Login
const firebaseConfig = {
  apiKey: "AIzaSy_YOUR_API_KEY_HERE",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase not configured properly. Cloud sync is disabled.", error);
}

export type AppData = {
  subjectData: SubjectDataMap;
  presenciales: PresencialEvent[];
  lastUpdated: number;
};

// Autenticación anónima silenciosa
export const initAuth = (onUser: (user: User | null) => void) => {
  if (!auth) return;
  onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      onUser(user);
    } else {
      signInAnonymously(auth!).catch(() => {
      });
    }
  });
};


export const syncDataToCloud = async (userId: string, data: AppData) => {
  if (!db) return false;
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...data,
      lastUpdated: Date.now()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error al sincronizar datos:", error);
    return false;
  }
};

export const getDataFromCloud = async (userId: string): Promise<AppData | null> => {
  if (!db) return null;
  try {
    const userRef = doc(db, 'users', userId);
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
