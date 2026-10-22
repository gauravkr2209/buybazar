import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function adminConfiguration() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

export function firebaseAdminIsConfigured(): boolean {
  return adminConfiguration() !== null;
}

function getAdminApp() {
  const config = adminConfiguration();
  if (!config) {
    throw new Error("Firebase server credentials are not configured.");
  }
  return (
    getApps().find((app) => app.name === "[DEFAULT]") ??
    initializeApp({
      credential: cert(config),
      projectId: config.projectId,
    })
  );
}

export function getFirebaseAuth() {
  return getAuth(getAdminApp());
}

export function getFirebaseFirestore() {
  return getFirestore(getAdminApp());
}
