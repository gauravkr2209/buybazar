import { PrismaClient } from "@prisma/client";
import {
  categorySlug,
  demoProducts,
  productCategories,
} from "../src/mocks/products";

const prisma = new PrismaClient();

async function seed() {
  const liveProductCollision = await prisma.product.findFirst({
    where: {
      slug: { in: demoProducts.map((product) => product.slug) },
      isDemo: false,
    },
    select: { slug: true },
  });
  if (liveProductCollision) {
    throw new Error(
      `Refusing to overwrite live product "${liveProductCollision.slug}" with demo data.`,
    );
  }

  const categories = new Map<string, string>();
  for (const name of productCategories) {
    const category = await prisma.category.upsert({
      where: { slug: categorySlug(name) },
      update: { name },
      create: { name, slug: categorySlug(name) },
    });
    categories.set(name, category.id);
  }

  for (const product of demoProducts) {
    const categoryId = categories.get(product.category);
    if (!categoryId) {
      throw new Error(`Missing category for demo product ${product.slug}`);
    }

    const storedProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        brand: product.brand,
        variant: product.variant,
        variantKey: product.variant.toLocaleLowerCase("en-IN"),
        description: product.description,
        attributes: product.specifications,
        categoryId,
        isDemo: true,
      },
      create: {
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        variant: product.variant,
        variantKey: product.variant.toLocaleLowerCase("en-IN"),
        description: product.description,
        attributes: product.specifications,
        categoryId,
        isDemo: true,
      },
    });

    const offerIds = new Map<number, string>();
    for (const [index, offer] of product.offers.entries()) {
      const normalizedName = offer.merchant.toLocaleLowerCase("en-IN");
      const merchant = await prisma.merchant.upsert({
        where: { normalizedName },
        update: { name: offer.merchant },
        create: { name: offer.merchant, normalizedName },
      });
      const providerOfferId = `demo:${product.slug}:${index + 1}`;
      const observedAt = new Date(
        `${product.priceHistory.at(-1)?.date ?? "2025-01-01"}T12:00:00.000Z`,
      );
      const storedOffer = await prisma.offer.upsert({
        where: {
          merchantId_productId_providerOfferId: {
            merchantId: merchant.id,
            productId: storedProduct.id,
            providerOfferId,
          },
        },
        update: {
          price: offer.price.toFixed(2),
          currency: offer.currency,
          availability: "UNKNOWN",
          isDemo: true,
          sourceName: offer.sourceLabel,
          sourceUrl: null,
          lastCheckedAt: observedAt,
          freshnessExpiresAt: null,
        },
        create: {
          merchantId: merchant.id,
          productId: storedProduct.id,
          providerOfferId,
          price: offer.price.toFixed(2),
          currency: offer.currency,
          availability: "UNKNOWN",
          isDemo: true,
          sourceName: offer.sourceLabel,
          sourceUrl: null,
          lastCheckedAt: observedAt,
        },
      });
      offerIds.set(index, storedOffer.id);
    }

    for (const observation of product.priceHistory) {
      for (const [index] of product.offers.entries()) {
        const offerId = offerIds.get(index);
        if (!offerId) {
          throw new Error(`Missing demo offer for ${product.slug}`);
        }
        const observedAt = new Date(`${observation.date}T12:00:00.000Z`);
        await prisma.priceObservation.upsert({
          where: {
            offerId_observedAt: { offerId, observedAt },
          },
          update: {
            price: observation.price.toFixed(2),
            availability: "UNKNOWN",
            isDemo: true,
            sourceName: "Fictional demo observation",
            sourceUrl: null,
          },
          create: {
            productId: storedProduct.id,
            offerId,
            price: observation.price.toFixed(2),
            currency: "INR",
            availability: "UNKNOWN",
            isDemo: true,
            sourceName: "Fictional demo observation",
            sourceUrl: null,
            observedAt,
          },
        });
      }
    }
  }

  console.info(`Seeded ${demoProducts.length} fictional demo products.`);
}

seed()
  .catch((error: unknown) => {
    console.error("Prisma demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
