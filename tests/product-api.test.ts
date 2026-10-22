import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { GET } from "../src/app/api/products/route";

test("product API serves the demo fallback with filtering and pagination", async () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
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
  } finally {
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
  }
});

test("product API validates page size and category values", async () => {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    const invalidSize = await GET(
      new NextRequest("http://localhost/api/products?pageSize=100"),
    );
    const invalidCategory = await GET(
      new NextRequest("http://localhost/api/products?category=not-a-category"),
    );
    assert.equal(invalidSize.status, 400);
    assert.equal(invalidCategory.status, 400);
  } finally {
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
  }
});
