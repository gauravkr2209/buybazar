"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DemoBadge from "@/components/demo-badge";
import ProductCard from "@/components/product-card";
import {
  categorySlug,
  demoProducts,
  productCategories,
  type ProductCategory,
} from "@/mocks/products";

type ProductBrowserProps = {
  initialCategory?: ProductCategory | "All";
};

type SortMode = "recommended" | "price-ascending" | "price-descending" | "name";
type ProductFilters = {
  query: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  sortMode: SortMode;
  activeCategory: ProductCategory | "All";
};

function isProductCategory(value: string | null): value is ProductCategory {
  return productCategories.some((category) => category === value);
}

function parsePrice(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : undefined;
}

export default function ProductBrowser({
  initialCategory = "All",
}: ProductBrowserProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get("q") ?? "";
  const brandFromUrl = searchParams.get("brand") ?? "";
  const minFromUrl = searchParams.get("minPrice") ?? "";
  const maxFromUrl = searchParams.get("maxPrice") ?? "";
  const sortFromUrl = searchParams.get("sort") ?? "recommended";
  const categoryFromUrl = searchParams.get("category");

  const urlFilters: ProductFilters = {
    query: queryFromUrl,
    brand: brandFromUrl,
    minPrice: minFromUrl,
    maxPrice: maxFromUrl,
    sortMode:
      sortFromUrl === "price-ascending" ||
        sortFromUrl === "price-descending" ||
        sortFromUrl === "name"
        ? sortFromUrl
        : "recommended",
    activeCategory:
      initialCategory === "All" && isProductCategory(categoryFromUrl)
        ? categoryFromUrl
        : initialCategory,
  };
  const [filters, setFilters] = useOptimistic(
    urlFilters,
    (current, update: Partial<ProductFilters>) => ({ ...current, ...update }),
  );
  const { query, brand, minPrice, maxPrice, sortMode, activeCategory } = filters;

  const updateUrl = useCallback(
    (key: string, value: string, update: Partial<ProductFilters>) => {
      const nextFilters = { ...filters, ...update };
      const params = new URLSearchParams();
      const values: Record<string, string> = {
        q: nextFilters.query.trim(),
        brand: nextFilters.brand,
        minPrice: nextFilters.minPrice,
        maxPrice: nextFilters.maxPrice,
        sort: nextFilters.sortMode === "recommended" ? "" : nextFilters.sortMode,
      };
      if (initialCategory === "All" && nextFilters.activeCategory !== "All") {
        values.category = nextFilters.activeCategory;
      }
      for (const [name, filterValue] of Object.entries(values)) {
        if (filterValue) params.set(name, filterValue);
      }
      if (key && value) params.set(key, value);
      else if (key) params.delete(key);
      const queryString = params.toString();
      startTransition(() => {
        setFilters(update);
        router.replace(
          queryString ? `${pathname}?${queryString}#discover` : `${pathname}#discover`,
          { scroll: false },
        );
      });
    },
    [filters, initialCategory, pathname, router, setFilters],
  );

  function selectCategory(category: ProductCategory) {
    if (initialCategory === "All") {
      updateUrl("category", category, { activeCategory: category });
      return;
    }

    startTransition(() => {
      setFilters({ activeCategory: category });
      const queryString = new URLSearchParams({
        ...(query.trim() ? { q: query.trim() } : {}),
        ...(brand ? { brand } : {}),
        ...(minPrice ? { minPrice } : {}),
        ...(maxPrice ? { maxPrice } : {}),
        ...(sortMode !== "recommended" ? { sort: sortMode } : {}),
      }).toString();
      router.push(`/category/${categorySlug(category)}${queryString ? `?${queryString}` : ""}#discover`);
    });
  }

  useEffect(() => {
    function handleSearch(event: Event) {
      if (event instanceof CustomEvent && typeof event.detail === "string") {
        updateUrl("q", event.detail.trim(), { query: event.detail });
      }
    }

    window.addEventListener("paisa-search", handleSearch);
    return () => window.removeEventListener("paisa-search", handleSearch);
  }, [updateUrl]);

  const brands = useMemo(
    () => [...new Set(demoProducts.map((product) => product.brand))].sort(),
    [],
  );

  const products = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("en-IN");
    const minimum = parsePrice(minPrice);
    const maximum = parsePrice(maxPrice);
    const filtered = demoProducts.filter((product) => {
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;
      const searchable = [
        product.name,
        product.brand,
        product.category,
        product.variant,
        ...product.specifications,
      ]
        .join(" ")
        .toLocaleLowerCase("en-IN");
      const matchesQuery =
        normalizedQuery.length === 0 || searchable.includes(normalizedQuery);
      const matchesBrand = brand.length === 0 || product.brand === brand;
      const demoPrice = product.offers.reduce(
        (lowest, offer) => Math.min(lowest, offer.price),
        Number.POSITIVE_INFINITY,
      );
      const matchesMinimum = minimum === undefined || demoPrice >= minimum;
      const matchesMaximum = maximum === undefined || demoPrice <= maximum;
      return (
        matchesCategory &&
        matchesQuery &&
        matchesBrand &&
        matchesMinimum &&
        matchesMaximum
      );
    });

    if (sortMode === "name") {
      return filtered.sort((left, right) => left.name.localeCompare(right.name));
    }
    if (sortMode === "price-ascending" || sortMode === "price-descending") {
      const direction = sortMode === "price-ascending" ? 1 : -1;
      return filtered.sort((left, right) => {
        const leftPrice = Math.min(...left.offers.map((offer) => offer.price));
        const rightPrice = Math.min(...right.offers.map((offer) => offer.price));
        return (leftPrice - rightPrice) * direction;
      });
    }
    return filtered;
  }, [activeCategory, brand, maxPrice, minPrice, query, sortMode]);

  return (
    <section className="catalog" id="discover" aria-labelledby="catalog-title">
      <div className="catalog__heading">
        <div>
          <p className="eyebrow"><span className="eyebrow__dot" /> A little inspiration</p>
          <h2 id="catalog-title">
            {activeCategory === "All"
              ? "Find your next good thing."
              : `Find ${activeCategory.toLocaleLowerCase("en-IN")} worth comparing.`}
          </h2>
          <p className="catalog__subheading">
            A considered collection of everyday favourites.
          </p>
        </div>
        <a className="catalog__browse-link" href="#product-list">
          Browse the collection <span aria-hidden="true">↘</span>
        </a>
      </div>

      <div className="demo-notice" role="note">
        <span className="demo-notice__mark" aria-hidden="true">i</span>
        <span>
          This concept catalogue contains fictional products, sellers, prices,
          and price-history points. It is <strong>DEMO DATA</strong>, not verified
          merchant information.
        </span>
        <DemoBadge />
      </div>

      <div className="category-tabs" role="group" aria-label="Filter products by category">
        {productCategories.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={activeCategory === category}
            onClick={() => selectCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="catalog__filters" aria-label="Search and filter demo products">
        <div className="catalog__search-wrap">
          <label className="sr-only" htmlFor="product-search">
            Search products, brands, or specifications
          </label>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none">
            <circle cx="8.8" cy="8.8" r="5.8" stroke="currentColor" strokeWidth="1.5" />
            <path d="m13.2 13.2 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            id="product-search"
            type="search"
            value={query}
            onChange={(event) => {
              updateUrl("q", event.target.value.trim(), { query: event.target.value });
            }}
            placeholder="Search this collection"
          />
        </div>

        <label className="catalog__filter">
          <span>Brand</span>
          <select
            value={brand}
            onChange={(event) => {
              updateUrl("brand", event.target.value, { brand: event.target.value });
            }}
          >
            <option value="">All brands</option>
            {brands.map((brandName) => (
              <option value={brandName} key={brandName}>{brandName}</option>
            ))}
          </select>
        </label>

        <label className="catalog__filter">
          <span>Min demo price (₹)</span>
          <input
            inputMode="numeric"
            type="number"
            min="0"
            value={minPrice}
            onChange={(event) => {
              updateUrl("minPrice", event.target.value, { minPrice: event.target.value });
            }}
          />
        </label>

        <label className="catalog__filter">
          <span>Max demo price (₹)</span>
          <input
            inputMode="numeric"
            type="number"
            min="0"
            value={maxPrice}
            onChange={(event) => {
              updateUrl("maxPrice", event.target.value, { maxPrice: event.target.value });
            }}
          />
        </label>

        <label className="catalog__filter">
          <span>Sort products</span>
          <select
            value={sortMode}
            onChange={(event) => {
              const requestedSort = event.target.value;
              const nextSort: SortMode =
                requestedSort === "price-ascending" ||
                  requestedSort === "price-descending" ||
                  requestedSort === "name"
                  ? requestedSort
                  : "recommended";
              updateUrl("sort", nextSort === "recommended" ? "" : nextSort, {
                sortMode: nextSort,
              });
            }}
          >
            <option value="recommended">Recommended</option>
            <option value="price-ascending">Demo price: low to high</option>
            <option value="price-descending">Demo price: high to low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </label>
      </div>

      <p className="catalog__result-count" role="status">
        Showing {products.length} of {demoProducts.length} demo products
      </p>

      <div className="product-grid" id="product-list" aria-live="polite">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {products.length === 0 && (
        <p className="catalog__empty" role="status">
          No demo products match these filters. Try changing your search or price range.
        </p>
      )}
    </section>
  );
}
