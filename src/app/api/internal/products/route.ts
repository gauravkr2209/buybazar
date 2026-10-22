import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest } from "next/server";
import { categorySlug, demoProducts, productCategories } from "@/mocks/products";
import { apiError, serviceUnavailable } from "@/lib/api-response";
import { databaseIsConfigured } from "@/lib/database-config";
import { getFirebaseFirestore } from "@/lib/firebase-admin";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { normalizeIdentifier } from "@/lib/providers/normalize";
import { ProviderOfferValidationError } from "@/lib/providers/types";

class ProductRegistrationConflict extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return serviceUnavailable("Set CRON_SECRET before registering catalog products.");
  }
  if (!isAuthorizedCronRequest(request)) {
    return apiError("Unauthorized catalog registration request.", 401);
  }
  if (!databaseIsConfigured()) {
    return serviceUnavailable("Configure Firebase before registering products.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) return apiError("Request body must be valid JSON.", 400);
    throw error;
  }
  if (!isRecord(body)) return apiError("Provide a product record.", 400);

  const fields = ["slug", "name", "brand", "variant", "variantKey", "category", "sourceName", "sourceUrl"] as const;
  if (fields.some((field) => typeof body[field] !== "string" || !body[field].trim())) {
    return apiError("Product identity and source attribution fields are required.", 400);
  }
  const slug = body.slug as string;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 160) {
    return apiError("Provide a valid product slug.", 400);
  }
  if (
    (body.name as string).length > 200 ||
    (body.brand as string).length > 120 ||
    (body.variant as string).length > 200 ||
    (body.variantKey as string).length > 200 ||
    (body.sourceName as string).length > 120
  ) {
    return apiError("One or more product fields exceed the supported length.", 400);
  }
  const category = productCategories.find(
    (name) => categorySlug(name) === body.category,
  );
  if (!category) return apiError("Product category is not supported.", 400);

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(body.sourceUrl as string);
  } catch {
    return apiError("Product source URL is invalid.", 400);
  }
  if (sourceUrl.protocol !== "https:" || sourceUrl.username || sourceUrl.password) {
    return apiError("Product source URL must use HTTPS and contain no credentials.", 400);
  }
  if (!Array.isArray(body.identifiers) || body.identifiers.length < 1 || body.identifiers.length > 10) {
    return apiError("Provide between one and ten exact product identifiers.", 400);
  }

  let identifiers: ReturnType<typeof normalizeIdentifier>[];
  try {
    identifiers = body.identifiers.map((identifier: unknown) => {
      if (
        !isRecord(identifier) ||
        typeof identifier.type !== "string" ||
        typeof identifier.value !== "string"
      ) {
        throw new Error("Malformed identifier.");
      }
      return normalizeIdentifier({
        type: identifier.type,
        value: identifier.value,
      });
    });
  } catch (error) {
    if (error instanceof ProviderOfferValidationError) {
      return apiError("Product identifiers are malformed.", 400);
    }
    throw error;
  }
  if (
    new Set(identifiers.map(({ type, value }) => `${type}:${value}`)).size !==
    identifiers.length
  ) {
    return apiError("Product identifiers must be unique.", 400);
  }

  const normalizedVariantKey = (body.variantKey as string)
    .trim()
    .toLocaleLowerCase("en-IN");
  try {
    if (demoProducts.some((product) => product.slug === slug)) {
      throw new ProductRegistrationConflict("A demo product slug cannot be converted into a live product.");
    }
    const db = getFirebaseFirestore();
    const productRef = db.collection("products").doc(slug);
    const identifierRefs = identifiers.map((identifier) =>
      db.collection("productIdentifiers").doc(
        createHash("sha256").update(`${identifier.type}\0${identifier.value}`).digest("hex"),
      ),
    );
    const product = await db.runTransaction(async (transaction) => {
      const [existingProduct, ...existingIdentifiers] = await transaction.getAll(
        productRef,
        ...identifierRefs,
      );
      if (existingProduct.exists && existingProduct.get("isDemo") === true) {
        throw new ProductRegistrationConflict("A demo product cannot be converted into a live product.");
      }
      if (existingIdentifiers.some((identifier) =>
        identifier.exists && identifier.get("productSlug") !== slug,
      )) {
        throw new ProductRegistrationConflict(
          "An identifier is already assigned to another product variant.",
        );
      }
      const value = {
        slug,
        name: (body.name as string).trim(),
        brand: (body.brand as string).trim(),
        variant: (body.variant as string).trim(),
        variantKey: normalizedVariantKey,
        description: typeof body.description === "string" ? body.description.trim() : "",
        attributes: isRecord(body.attributes) ? body.attributes : {},
        category: { name: category, slug: categorySlug(category) },
        identifiers,
        sourceName: (body.sourceName as string).trim(),
        sourceUrl: sourceUrl.toString(),
        isDemo: false,
        updatedAt: FieldValue.serverTimestamp(),
      };
      transaction.set(productRef, {
        ...value,
        ...(existingProduct.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      }, { merge: true });
      identifierRefs.forEach((reference, index) => {
        transaction.set(reference, {
          ...identifiers[index],
          productSlug: slug,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      return {
        slug,
        name: value.name,
        brand: value.brand,
        variant: value.variant,
        isDemo: false,
      };
    });

    return Response.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof ProductRegistrationConflict) {
      return apiError(error.message, 409);
    }
    throw error;
  }
}
