"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { firebaseClientIsConfigured } from "@/lib/firebase-config";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { signOut as firebaseSignOut } from "firebase/auth";

export default function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function signOut() {
    setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        setError("Unable to clear your PaisaPath session. Please try again.");
        return;
      }
      if (firebaseClientIsConfigured()) await firebaseSignOut(getFirebaseClientAuth());
      router.replace("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication service is unavailable. Please try again.");
    }
  }

  return (
    <span className="sign-out-control">
    <button className="button button--light" type="button" onClick={() => void signOut()}>
      Sign out
    </button>
      {error && <span className="account-form__error" role="alert">{error}</span>}
    </span>
  );
}
