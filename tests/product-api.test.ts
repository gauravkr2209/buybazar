import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { GET } from "../src/app/api/products/route";

const firebaseVariables = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
] as const;

async function withFirebaseDisabled(run: () => Promise<void>) {
  const previous = Object.fromEntries(
    firebaseVariables.map((name) => [name, process.env[name]]),
  );
  for (const name of firebaseVariables) delete process.env[name];
  try {
    await run();
  } finally {
    for (const name of firebaseVariables) {
      const value = previous[name];
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

test("product API serves the demo fallback with filtering and pagination", async () => {
  await withFirebaseDisabled(async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/products?category=smartphones&q=aster&page=1&pageSize=10&sort=name",
      ),
    );
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.dataStatus, "DEMO");
    assert.equal(body.products.length, 4);
    assert.equal(body.total, 4);
    assert.ok(body.products.every((product: { dataStatus?: string; brand: string }) =>
      product.brand === "Aster" || product.brand === "Paper Sky",
    ));
  });
});

test("product API validates page size and category values", async () => {
  await withFirebaseDisabled(async () => {
    const invalidSize = await GET(
      new NextRequest("http://localhost/api/products?pageSize=100"),
    );
    const invalidCategory = await GET(
      new NextRequest("http://localhost/api/products?category=not-a-category"),
    );
    assert.equal(invalidSize.status, 400);
    assert.equal(invalidCategory.status, 400);
  });
});
