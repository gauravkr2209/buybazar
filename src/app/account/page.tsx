import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AccountDashboard from "@/components/account-dashboard";
import { authIsConfigured, getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const requestHeaders = await headers();
  if (!authIsConfigured()) {
    return (
      <main className="account-page">
        <section className="account-panel" role="status">
          <h1>Account services need setup.</h1>
          <p>Set DATABASE_URL, BETTER_AUTH_URL, and a 32-character BETTER_AUTH_SECRET using .env.example.</p>
        </section>
      </main>
    );
  }

  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session?.user) redirect("/sign-in");

  const [watchlist, alerts] = await Promise.all([
    prisma.watchlistItem.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        product: {
          select: {
            slug: true,
            name: true,
            brand: true,
            variant: true,
            isDemo: true,
          },
        },
      },
    }),
    prisma.targetPriceAlert.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        targetPrice: true,
        enabled: true,
        product: { select: { slug: true, name: true, isDemo: true } },
        notifications: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true, message: true, createdAt: true },
        },
      },
    }),
  ]);

  return (
    <main className="account-page">
      <AccountDashboard
        name={session.user.name}
        email={session.user.email}
        watchlist={watchlist}
        alerts={alerts.map((alert) => ({
          ...alert,
          targetPrice: alert.targetPrice.toFixed(2),
          notifications: alert.notifications.map((notification) => ({
            ...notification,
            createdAt: notification.createdAt.toISOString(),
          })),
        }))}
      />
    </main>
  );
}
