"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type ProductWatchControlsProps = { productSlug: string };

async function readError(response: Response): Promise<string> {
  const body: unknown = await response.json();
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "object" &&
    body.error !== null &&
    "message" in body.error &&
    typeof body.error.message === "string"
  ) {
    return body.error.message;
  }
  return `Request failed (${response.status}).`;
}

export default function ProductWatchControls({
  productSlug,
}: ProductWatchControlsProps) {
  const [targetPrice, setTargetPrice] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [signInRequired, setSignInRequired] = useState(false);

  async function request(path: string, options: RequestInit, success: string) {
    setBusy(true);
    setMessage("");
    setSignInRequired(false);
    try {
      const response = await fetch(path, options);
      if (!response.ok) {
        if (response.status === 401) setSignInRequired(true);
        setMessage(await readError(response));
        return false;
      }
      setMessage(success);
      return true;
    } catch {
      setMessage("The service could not be reached. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addToWatchlist() {
    await request(
      "/api/watchlist",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: productSlug }),
      },
      "Saved to your watchlist.",
    );
  }

  async function createAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const created = await request(
      "/api/alerts",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: productSlug, targetPrice }),
      },
      "Target alert saved. It is evaluated only against fresh, verified observations.",
    );
    if (created) setTargetPrice("");
  }

  return (
    <div className="product-watch-controls">
      <button
        className="button button--dark"
        type="button"
        disabled={busy}
        onClick={addToWatchlist}
      >
        Save to watchlist
      </button>
      <form className="target-alert-form" onSubmit={createAlert}>
        <label htmlFor="target-price">INR target price</label>
        <input
          id="target-price"
          type="number"
          min="0.01"
          step="0.01"
          required
          value={targetPrice}
          onChange={(event) => setTargetPrice(event.target.value)}
        />
        <button className="button button--light" type="submit" disabled={busy}>
          Create alert
        </button>
      </form>
      {message && <p role="status" className="product-watch-controls__message">{message}</p>}
      {signInRequired && (
        <Link className="product-watch-controls__signin" href="/sign-in">
          Sign in to continue
        </Link>
      )}
    </div>
  );
}
