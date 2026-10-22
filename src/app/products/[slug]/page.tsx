import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DemoBadge from "@/components/demo-badge";
import PriceHistoryChart from "@/components/price-history-chart";
import ProductArtwork from "@/components/product-artwork";
import ProductWatchControls from "@/components/product-watch-controls";
import {
  demoProducts,
  formatDemoPrice,
  getLowestDemoOffer,
} from "@/mocks/products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return demoProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = demoProducts.find((item) => item.slug === slug);
  if (!product) return { title: "Product not found — PaisaPath" };
  return {
    title: `${product.name} — PaisaPath demo comparison`,
    description: `${product.description} Fictional demo offers and price observations.`,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = demoProducts.find((item) => item.slug === slug);
  if (!product) notFound();

  const lowestOffer = getLowestDemoOffer(product);

  return (
    <main className="product-detail">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/#discover">Explore</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <section className="product-detail__intro" aria-labelledby="product-title">
        <div
          className="product-detail__art"
          style={{ "--art-bg": product.artBackground } as React.CSSProperties}
        >
          <ProductArtwork
            art={product.art}
            finish={product.finish}
            idPrefix={product.slug}
          />
          <span className="product-detail__art-label">FICTIONAL PRODUCT · DEMO ART</span>
        </div>
        <div className="product-detail__info">
          <p className="eyebrow"><span className="eyebrow__dot" /> {product.brand} · {product.category} · {product.finish}</p>
          <h1 id="product-title">{product.name}</h1>
          <p className="product-detail__description">{product.description}</p>
          <dl className="product-detail__specifications">
            <div><dt>Variant</dt><dd>{product.variant}</dd></div>
            {product.specifications.map((specification) => (
              <div key={specification}><dt>Specification</dt><dd>{specification}</dd></div>
            ))}
          </dl>
          <div className="product-detail__demo-callout" role="note">
            <DemoBadge />
            <span>
              Fictional product and seller listings for a visual demo only.
              These are not real offers or live prices.
            </span>
          </div>
          <div className="product-detail__price-summary">
            <div>
              <strong>
                {lowestOffer
                  ? formatDemoPrice(lowestOffer.price)
                  : "No demo value"}
              </strong>
              <small>
                {lowestOffer
                  ? `Lowest fictional demo value · ${lowestOffer.merchant}`
                  : "No seller values are included in this demo product."}
              </small>
            </div>
            <DemoBadge />
          </div>
          <ProductWatchControls productSlug={product.slug} />
        </div>
      </section>

      <section className="detail-section" aria-labelledby="seller-title">
        <div className="detail-section__heading">
          <div>
            <h2 id="seller-title">Compare demo sellers.</h2>
            <p>Fictional listings to preview how seller comparisons could look.</p>
          </div>
          <DemoBadge />
        </div>
        <div className="seller-table" role="table" aria-label={`Fictional seller comparisons for ${product.name}`}>
          <div className="seller-table__head" role="row">
            <span role="columnheader">Demo source</span>
            <span role="columnheader">Price · INR</span>
            <span role="columnheader">Delivery</span>
            <span role="columnheader">Listing</span>
          </div>
          {product.offers.map((offer) => (
            <div className="seller-row" role="row" key={offer.merchant}>
              <span className="seller-row__name" role="cell">
                <span className="seller-row__mark" aria-hidden="true">
                  {offer.merchant.charAt(0)}
                </span>
                <span>
                  {offer.merchant}
                  <small>{offer.sourceLabel}</small>
                </span>
              </span>
              <span className="seller-row__price" role="cell">
                {formatDemoPrice(offer.price)}
                <DemoBadge />
              </span>
              <span className="seller-row__delivery" role="cell">
                {offer.delivery ?? "Not provided"}
              </span>
              <span className="seller-row__status" role="cell">
                Not a live listing
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="detail-section" aria-labelledby="history-title">
        <div className="detail-section__heading">
          <div>
            <h2 id="history-title">A little price perspective.</h2>
            <p>Sample observations are fictional and do not represent a real seller’s history.</p>
          </div>
          <DemoBadge label="DEMO OBSERVATIONS" />
        </div>
        <PriceHistoryChart observations={product.priceHistory} />
      </section>

      <Link className="detail-back-link" href="/#discover">
        <span aria-hidden="true">←</span> Back to all demo products
      </Link>
    </main>
  );
}
