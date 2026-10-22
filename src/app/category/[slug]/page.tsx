import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import ProductBrowser from "@/components/product-browser";
import { categorySlug, productCategories } from "@/mocks/products";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

function findCategory(slug: string) {
  return productCategories.find((category) => categorySlug(category) === slug);
}

export function generateStaticParams() {
  return productCategories.map((category) => ({
    slug: categorySlug(category),
  }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = findCategory(slug);
  if (!category) return { title: "Category not found — PaisaPath" };

  return {
    title: `${category} — PaisaPath demo collection`,
    description: `Explore fictional ${category.toLocaleLowerCase("en-IN")} products with clearly labelled demo prices.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = findCategory(slug);
  if (!category) notFound();

  return (
    <main>
      <Suspense fallback={<div className="route-loading">Loading demo products…</div>}>
        <ProductBrowser key={category} initialCategory={category} />
      </Suspense>
    </main>
  );
}
