import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { authIsConfigured } from "@/lib/auth";
import { apiError, serviceUnavailable } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId } from "@/lib/request-auth";

type AlertRouteProps = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: AlertRouteProps) {
  if (!authIsConfigured()) {
    return serviceUnavailable("Configure the database and authentication before editing price alerts.");
  }
  const userId = await getAuthenticatedUserId();
  if (!userId) return apiError("Sign in to edit price alerts.", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) return apiError("Request body must be valid JSON.", 400);
    throw error;
  }
  if (typeof body !== "object" || body === null) {
    return apiError("Provide an alert update.", 400);
  }

  const data: { enabled?: boolean; targetPrice?: string } = {};
  if ("enabled" in body) {
    if (typeof body.enabled !== "boolean") return apiError("enabled must be a boolean.", 400);
    data.enabled = body.enabled;
  }
  if ("targetPrice" in body) {
    if (
      typeof body.targetPrice !== "string" ||
      !/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(body.targetPrice) ||
      Number(body.targetPrice) <= 0 ||
      !Number.isFinite(Number(body.targetPrice))
    ) {
      return apiError("targetPrice must be a positive INR amount with up to two decimals.", 400);
    }
    data.targetPrice = body.targetPrice;
  }
  if (Object.keys(data).length === 0) return apiError("Provide enabled or targetPrice.", 400);

  const { id } = await params;
  try {
    const result = await prisma.targetPriceAlert.updateMany({
      where: { id, userId },
      data,
    });
    if (result.count === 0) return apiError("Price alert not found.", 404);
    return Response.json({ updated: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return apiError("An alert for this product and target price already exists.", 409);
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: AlertRouteProps) {
  if (!authIsConfigured()) {
    return serviceUnavailable("Configure the database and authentication before deleting price alerts.");
  }
  const userId = await getAuthenticatedUserId();
  if (!userId) return apiError("Sign in to delete price alerts.", 401);

  const { id } = await params;
  const result = await prisma.targetPriceAlert.deleteMany({
    where: { id, userId },
  });
  if (result.count === 0) return apiError("Price alert not found.", 404);
  return Response.json({ deleted: true });
}
