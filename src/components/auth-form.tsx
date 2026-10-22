"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result =
        mode === "sign-in"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ name, email, password });
      if (result.error) {
        setError(result.error.message ?? "Authentication failed. Please try again.");
        return;
      }
      router.replace("/account");
      router.refresh();
    } catch {
      setError("Authentication service is unavailable. Check the database and auth configuration.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="account-panel" aria-labelledby="auth-title">
      <p className="eyebrow"><span className="eyebrow__dot" /> Your PaisaPath account</p>
      <h1 id="auth-title">{mode === "sign-in" ? "Welcome back." : "Create your account."}</h1>
      <p>Keep a private shortlist and manage your target-price alerts.</p>
      <form className="account-form" onSubmit={submit}>
        {mode === "sign-up" && (
          <label>
            Name
            <input
              autoComplete="name"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            minLength={8}
            maxLength={128}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <p className="account-form__error" role="alert">{error}</p>}
        <button className="button button--dark" type="submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p className="account-panel__switch">
        {mode === "sign-in" ? "New to PaisaPath?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            setError("");
          }}
        >
          {mode === "sign-in" ? "Create an account" : "Sign in"}
        </button>
      </p>
      <Link className="detail-back-link" href="/">Back to shopping</Link>
    </section>
  );
}
