import { firebaseAdminIsConfigured } from "@/lib/firebase-admin";
import { firebaseClientIsConfigured } from "@/lib/firebase-config";

export function authIsConfigured(): boolean {
  return firebaseAdminIsConfigured() && firebaseClientIsConfigured();
}
