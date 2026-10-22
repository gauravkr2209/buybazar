import { cookies } from "next/headers";
import { FirebaseAuthError } from "firebase-admin/auth";
import { getFirebaseAuth } from "@/lib/firebase-admin";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const sessionCookie = (await cookies()).get("__session")?.value;
  if (!sessionCookie) return null;

  try {
    const session = await getFirebaseAuth().verifySessionCookie(sessionCookie, true);
    return {
      id: session.uid,
      name: typeof session.name === "string" ? session.name : "PaisaPath member",
      email: typeof session.email === "string" ? session.email : "",
    };
  } catch (error) {
    if (error instanceof FirebaseAuthError) return null;
    throw error;
  }
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  return (await getAuthenticatedUser())?.id ?? null;
}
