"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function signOut() {
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError(result.error.message ?? "Unable to sign out.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Authentication service is unavailable. Please try again.");
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
