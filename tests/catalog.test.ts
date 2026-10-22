import assert from "node:assert/strict";
import test from "node:test";
import {
  demoProducts,
  productCategories,
  type ProductCategory,
} from "../src/mocks/products";

const expectedCounts: Record<ProductCategory, number> = {
  Smartphones: 15,
  Laptops: 12,
  "Headphones and earbuds": 10,
  Smartwatches: 8,
  "TVs and monitors": 8,
  Tablets: 7,
  "Computer accessories": 10,
  "Home appliances": 12,
  "Kitchen appliances": 8,
  "Fashion and footwear": 10,
  "Beauty and grooming": 8,
  "Home and furniture": 7,
  "Cameras and gaming": 5,
};

test("catalogue contains exactly the requested category counts", () => {
  assert.equal(demoProducts.length, 120);
  for (const category of productCategories) {
    assert.equal(
      demoProducts.filter((product) => product.category === category).length,
      expectedCounts[category],
      `${category} count`,
    );
  }
});

test("catalogue IDs and slugs are unique and all mock data remains explicit", () => {
  assert.equal(new Set(demoProducts.map((product) => product.id)).size, 120);
  assert.equal(new Set(demoProducts.map((product) => product.slug)).size, 120);
  for (const product of demoProducts) {
    assert.equal(product.dataStatus, "DEMO");
    assert.ok(product.brand);
    assert.ok(product.variant);
    assert.ok(product.specifications.length > 0);
    assert.ok(product.offers.every(
      (offer) =>
        offer.status === "DEMO" &&
        offer.url === null &&
        offer.availability === null,
    ));
    assert.ok(product.priceHistory.every((observation) => observation.status === "DEMO"));
  }
});
