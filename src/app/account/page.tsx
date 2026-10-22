import { Suspense } from "react";
import { redirect } from "next/navigation";
import AccountDashboard from "@/components/account-dashboard";
import { authIsConfigured } from "@/lib/auth";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { getAuthenticatedUser } from "@/lib/request-auth";

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <main className="account-page">
          <section className="account-panel" role="status">
            <h1>Loading your account...</h1>
          </section>
        </main>
      }
    >
      <AccountPageContent />
    </Suspense>
  );
}

async function AccountPageContent() {
  if (!authIsConfigured()) {
    return (
      <main className="account-page">
        <section className="account-panel" role="status">
          <h1>Account services need setup.</h1>
          <p>Configure Firebase Authentication and server credentials using .env.example.</p>
        </section>
      </main>
    );
  }

  const user = await getAuthenticatedUser();
  if (!user) redirect("/sign-in");

  const db = getFirebaseFirestore();
  const userRef = db.collection("users").doc(user.id);
  const [watchlist, alerts] = await Promise.all([
    userRef.collection("watchlist").orderBy("createdAt", "desc").get(),
    userRef.collection("alerts").orderBy("createdAt", "desc").get(),
  ]);
  const accountAlerts = await Promise.all(
    alerts.docs.map(async (alert) => {
      const data = alert.data();
      const notifications = await alert.ref
        .collection("notifications")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();
      const product = await db.collection("products").doc(data.productSlug).get();
      const productData = product.data();
      return {
        id: alert.id,
        targetPrice: String(data.targetPrice),
        enabled: data.enabled === true,
        product: {
          slug: String(data.productSlug),
          name: String(data.productName ?? productData?.name ?? data.productSlug),
          isDemo: data.isDemo === true,
        },
        notifications: notifications.docs.map((notification) => {
          const notificationData = notification.data();
          const createdAt = notificationData.createdAt?.toDate?.() ?? new Date();
          return {
            status: String(notificationData.status ?? "PENDING"),
            message: String(notificationData.message ?? "Price alert matched."),
            createdAt: createdAt.toISOString(),
          };
        }),
      };
    }),
  );

  return (
    <main className="account-page">
      <AccountDashboard
        name={user.name}
        email={user.email}
        watchlist={watchlist.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            product: {
              slug: String(data.slug),
              name: String(data.name),
              brand: String(data.brand),
              variant: String(data.variant),
              isDemo: data.isDemo === true,
            },
          };
        })}
        alerts={accountAlerts}
      />
    </main>
  );
}
