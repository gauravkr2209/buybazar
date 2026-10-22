"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GithubAuthProvider, getRedirectResult, signInWithRedirect } from "firebase/auth";
import { firebaseClientIsConfigured } from "@/lib/firebase-config";
import { getFirebaseClientAuth } from "@/lib/firebase-client";

export default function AuthForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!firebaseClientIsConfigured()) return;
    let active = true;
    void getRedirectResult(getFirebaseClientAuth())
      .then(async (result) => {
        if (!result) return;
        const idToken = await result.user.getIdToken();
        const response = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (!response.ok) {
          const body: unknown = await response.json();
          const message =
            typeof body === "object" &&
            body !== null &&
            "error" in body &&
            typeof body.error === "object" &&
            body.error !== null &&
            "message" in body.error &&
            typeof body.error.message === "string"
              ? body.error.message
              : `Sign-in failed (${response.status}).`;
          throw new Error(message);
        }
        if (active) {
          router.replace("/account");
          router.refresh();
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : "GitHub sign-in failed. Please try again.");
        }
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function signIn() {
    if (!firebaseClientIsConfigured()) {
      setError("Firebase web configuration is missing. Contact the site administrator.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await signInWithRedirect(getFirebaseClientAuth(), new GithubAuthProvider());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "GitHub sign-in failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <section className="account-panel" aria-labelledby="auth-title">
      <p className="eyebrow"><span className="eyebrow__dot" /> Your PaisaPath account</p>
      <h1 id="auth-title">Welcome to PaisaPath.</h1>
      <p>Keep a private shortlist and manage your target-price alerts.</p>
      {error && <p className="account-form__error" role="alert">{error}</p>}
      <button className="button button--dark" type="button" onClick={() => void signIn()} disabled={busy}>
        {busy ? "Redirecting to GitHub…" : "Continue with GitHub"}
      </button>
      <Link className="detail-back-link" href="/">Back to shopping</Link>
    </section>
  );
}
