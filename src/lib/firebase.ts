import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

// Initialize Firebase SDK
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore using the provisioned custom databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

export default app;
