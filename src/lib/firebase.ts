import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBQ5ar8Tma9uJ6R7zKTNgdEwL92mONT6iw",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "envisionpaths-af656.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "envisionpaths-af656",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "envisionpaths-af656.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "301821479100",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:301821479100:web:ceda6b59b90f12001fa8b9",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7BL53B9LFP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics is only available in browser
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
