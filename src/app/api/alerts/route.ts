import { Prisma } from "@prisma/client";
import { authIsConfigured } from "@/lib/auth";
import { apiError, serviceUnavailable } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/request-auth";

const PRICE_PATTERN = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;

function validPrice(value: unknown): value is string {
  return (
    typeof value === "string" &&
    PRICE_PATTERN.test(value) &&
    Number(value) > 0 &&
    Number.isFinite(Number(value))
  );
}

export async function GET() {
  if (!authIsConfigured()) {
    return serviceUnavailable("Configure the database and authentication before using price alerts.");
  }
  const userId = await getAuthenticatedUserId();
  if (!userId) return apiError("Sign in to view price alerts.", 401);

  const alerts = await prisma.targetPriceAlert.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      targetPrice: true,
      currency: true,
      enabled: true,
      createdAt: true,
      updatedAt: true,
      product: { select: { slug: true, name: true, isDemo: true } },
      notifications: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, message: true, createdAt: true },
      },
    },
  });
  return Response.json({
    alerts: alerts.map((alert) => ({
      ...alert,
      targetPrice: alert.targetPrice.toFixed(2),
    })),
  });
}

export async function POST(request: Request) {
  if (!authIsConfigured()) {
    return serviceUnavailable("Configure the database and authentication before creating alerts.");
  }
  const userId = await getAuthenticatedUserId();
  if (!userId) return apiError("Sign in to create price alerts.", 401);

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
    !("slug" in body) ||
    typeof body.slug !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug) ||
    !("targetPrice" in body) ||
    !validPrice(body.targetPrice)
  ) {
    return apiError("Provide a valid product slug and positive INR target price.", 400);
  }

  const product = await prisma.product.findUnique({
    where: { slug: body.slug },
    select: { id: true },
  });
  if (!product) return apiError("Product not found.", 404);

  const targetPrice = new Prisma.Decimal(body.targetPrice);
  const alert = await prisma.targetPriceAlert.upsert({
    where: {
      userId_productId_targetPrice: {
        userId,
        productId: product.id,
        targetPrice,
      },
    },
    update: { enabled: true },
    create: { userId, productId: product.id, targetPrice, currency: "INR" },
    select: { id: true, targetPrice: true, enabled: true },
  });
  return Response.json({
    alert: { ...alert, targetPrice: alert.targetPrice.toFixed(2) },
  });
}
