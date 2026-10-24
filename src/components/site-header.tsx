"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { categorySlug, productCategories } from "@/mocks/products";

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
    >
      <circle cx="8.8" cy="8.8" r="5.8" stroke="currentColor" strokeWidth="1.5" />
      <path d="m13.2 13.2 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function SiteHeader() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const productSearch = document.getElementById("product-search");
    if (!productSearch) {
      const query = new URLSearchParams({ q: search.trim() });
      router.push(`/?${query.toString()}#discover`);
      return;
    }
    window.dispatchEvent(new CustomEvent("paisa-search", { detail: search }));
    productSearch?.scrollIntoView({ behavior: "smooth" });
    productSearch?.focus();
  }

  return (
    <header className="site-header">
      <div className="site-header__main">
        <Link className="brand" href="/" aria-label="PaisaPath home">
          <span className="brand__mark" aria-hidden="true">p</span>
          <span className="brand__name">paisapath<span>.</span></span>
        </Link>
        <form className="site-header__search" role="search" onSubmit={applySearch}>
          <SearchIcon />
          <label className="sr-only" htmlFor="site-search">Search demo products</label>
          <input
            id="site-search"
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              window.dispatchEvent(new CustomEvent("paisa-search", { detail: event.target.value }));
            }}
            placeholder="Search products, brands, and more"
          />
        </form>
        <Link className="site-header__account" href="/account">
          <span className="site-header__account-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="6.5" r="3" stroke="currentColor" strokeWidth="1.4" />
              <path d="M4.5 17c.5-3 2.4-4.6 5.5-4.6s5 1.6 5.5 4.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          <span>Account</span>
        </Link>
      </div>
      <nav className="category-nav" aria-label="Product categories">
        {productCategories.map((category) => (
          <Link
            key={category}
            href={`/category/${categorySlug(category)}`}
          >
            {category}
          </Link>
        ))}
      </nav>
    </header>
  );
}
