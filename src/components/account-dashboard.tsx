"use client";

import { useState } from "react";
import Link from "next/link";
import SignOutButton from "@/components/sign-out-button";

export type AccountWatchlistItem = {
  id: string;
  product: {
    slug: string;
    name: string;
    brand: string;
    variant: string;
    isDemo: boolean;
  };
};

export type AccountAlert = {
  id: string;
  targetPrice: string;
  enabled: boolean;
  product: { slug: string; name: string; isDemo: boolean };
  notifications: { status: string; message: string; createdAt: string }[];
};

type AccountDashboardProps = {
  name: string;
  email: string;
  watchlist: AccountWatchlistItem[];
  alerts: AccountAlert[];
};

async function responseError(response: Response): Promise<string> {
  const body: unknown = await response.json();
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "object" &&
    body.error !== null &&
    "message" in body.error &&
    typeof body.error.message === "string"
  ) return body.error.message;
  return `Request failed (${response.status}).`;
}

export default function AccountDashboard({
  name,
  email,
  watchlist: initialWatchlist,
  alerts: initialAlerts,
}: AccountDashboardProps) {
  const [watchlist, setWatchlist] = useState(initialWatchlist);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [targetEdits, setTargetEdits] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function removeProduct(slug: string) {
    try {
      const response = await fetch(`/api/watchlist?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setMessage(await responseError(response));
        return;
      }
      setWatchlist((items) => items.filter((item) => item.product.slug !== slug));
      setMessage("Removed from your watchlist.");
    } catch {
      setMessage("The service could not be reached. Please try again.");
    }
  }

  async function updateAlert(id: string, body: { enabled: boolean } | { targetPrice: string }) {
    try {
      const response = await fetch(`/api/alerts/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        setMessage(await responseError(response));
        return false;
      }
      setAlerts((items) =>
        items.map((alert) =>
          alert.id === id
            ? {
                ...alert,
                ...body,
                targetPrice: "targetPrice" in body ? body.targetPrice : alert.targetPrice,
              }
            : alert,
        ),
      );
      setMessage("Alert updated.");
      return true;
    } catch {
      setMessage("The service could not be reached. Please try again.");
      return false;
    }
  }

  async function deleteAlert(id: string) {
    try {
      const response = await fetch(`/api/alerts/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setMessage(await responseError(response));
        return;
      }
      setAlerts((items) => items.filter((alert) => alert.id !== id));
      setMessage("Alert deleted.");
    } catch {
      setMessage("The service could not be reached. Please try again.");
    }
  }

  return (
    <section className="account-dashboard">
      <header className="account-dashboard__header">
        <div>
          <p className="eyebrow"><span className="eyebrow__dot" /> Private account</p>
          <h1>Good to see you, {name}.</h1>
          <p>{email}</p>
        </div>
        <SignOutButton />
      </header>
      {message && <p role="status" className="account-dashboard__message">{message}</p>}
      <section className="account-dashboard__section" aria-labelledby="watchlist-title">
        <h2 id="watchlist-title">Your watchlist</h2>
        {watchlist.length === 0 ? (
          <p>Your saved products will appear here.</p>
        ) : (
          <ul className="account-list">
            {watchlist.map(({ id, product }) => (
              <li key={id}>
                <div>
                  <Link href={`/products/${product.slug}`}>{product.name}</Link>
                  <small>{product.brand} · {product.variant} · {product.isDemo ? "DEMO DATA" : "Product"}</small>
                </div>
                <button type="button" onClick={() => void removeProduct(product.slug)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="account-dashboard__section" aria-labelledby="alerts-title">
        <h2 id="alerts-title">Target-price alerts</h2>
        <p className="account-dashboard__note">
          Alerts are evaluated only using fresh verified INR observations. Pending items are not email or push deliveries.
        </p>
        {alerts.length === 0 ? (
          <p>No target-price alerts yet.</p>
        ) : (
          <ul className="account-list account-list--alerts">
            {alerts.map((alert) => (
              <li key={alert.id}>
                <div>
                  <Link href={`/products/${alert.product.slug}`}>{alert.product.name}</Link>
                  <small>
                    ₹{new Intl.NumberFormat("en-IN").format(Number(alert.targetPrice))} target
                    {alert.product.isDemo ? " · product is demo data" : ""}
                  </small>
                  <form
                    className="account-alert-edit"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void updateAlert(alert.id, {
                        targetPrice: targetEdits[alert.id] ?? alert.targetPrice,
                      });
                    }}
                  >
                    <label className="sr-only" htmlFor={`target-${alert.id}`}>Edit target price in INR</label>
                    <input
                      id={`target-${alert.id}`}
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={targetEdits[alert.id] ?? alert.targetPrice}
                      onChange={(event) => {
                        setTargetEdits((values) => ({
                          ...values,
                          [alert.id]: event.target.value,
                        }));
                      }}
                    />
                    <button type="submit">Update target</button>
                  </form>
                  {alert.notifications[0] && (
                    <small>
                      {alert.notifications[0].status}: {alert.notifications[0].message}
                    </small>
                  )}
                </div>
                <div className="account-list__actions">
                  <button
                    type="button"
                    onClick={() => void updateAlert(alert.id, { enabled: !alert.enabled })}
                  >
                    {alert.enabled ? "Disable" : "Enable"}
                  </button>
                  <button type="button" onClick={() => void deleteAlert(alert.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
