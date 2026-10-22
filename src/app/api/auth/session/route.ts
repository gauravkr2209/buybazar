import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { FirebaseAuthError } from "firebase-admin/auth";
import { authIsConfigured } from "@/lib/auth";
import { apiError, serviceUnavailable } from "@/lib/api-response";
import { getFirebaseAuth, getFirebaseFirestore } from "@/lib/firebase-admin";

const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  if (!authIsConfigured()) {
    return serviceUnavailable("Configure Firebase Authentication and server credentials before signing in.");
  }

  const origin = request.headers.get("origin");
  let requestOrigin: string;
  try {
    requestOrigin = origin ? new URL(origin).origin : "";
  } catch {
    requestOrigin = "";
  }
  if (!requestOrigin || requestOrigin !== request.nextUrl.origin) {
    return apiError("Sign-in request origin is invalid.", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) return apiError("Request body must be valid JSON.", 400);
    throw error;
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("idToken" in body) ||
    typeof body.idToken !== "string" ||
    body.idToken.length < 1 ||
    body.idToken.length > 12_000
  ) {
    return apiError("Provide a valid Firebase sign-in token.", 400);
  }

  const auth = getFirebaseAuth();
  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(body.idToken, true);
  } catch (error) {
    if (error instanceof FirebaseAuthError) {
      return apiError("The sign-in token is invalid or expired.", 401);
    }
    throw error;
  }

  const user = await auth.getUser(decodedToken.uid);
  const sessionCookie = await auth.createSessionCookie(body.idToken, {
    expiresIn: SESSION_DURATION_MS,
  });
  await getFirebaseFirestore().collection("users").doc(user.uid).set(
    {
      name: user.displayName ?? "PaisaPath member",
      email: user.email ?? "",
      image: user.photoURL ?? null,
      updatedAt: new Date(),
    },
    { merge: true },
  );

  (await cookies()).set("__session", sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
  return Response.json({ signedIn: true });
}
