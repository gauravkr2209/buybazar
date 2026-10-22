import Link from "next/link";
import DemoBadge from "@/components/demo-badge";
import ProductArtwork from "@/components/product-artwork";
import {
  formatDemoPrice,
  getLowestDemoOffer,
  type DemoProduct,
} from "@/mocks/products";

type ProductCardProps = {
  product: DemoProduct;
};

export default function ProductCard({ product }: ProductCardProps) {
  const lowestOffer = getLowestDemoOffer(product);
  if (!lowestOffer) return null;

  return (
    <article className="product-card">
      <Link
        className="product-card__link"
        href={`/products/${product.slug}`}
        aria-label={`View ${product.name}, fictional demo price ${formatDemoPrice(lowestOffer.price)} from ${lowestOffer.merchant}`}
      >
        <div
          className="product-card__art"
          style={{ "--art-bg": product.artBackground } as React.CSSProperties}
        >
          <div className="product-card__topline">
            <span className="product-card__tag">{product.finish}</span>
            <DemoBadge />
          </div>
          <ProductArtwork
            art={product.art}
            finish={product.finish}
            idPrefix={product.slug}
          />
        </div>
        <div className="product-card__body">
          <span className="product-card__category">{product.category}</span>
          <h3>{product.name}</h3>
          <p className="product-card__seller">{product.brand} · {product.variant}</p>
          <div className="product-card__price-line">
            <span className="product-card__price">{formatDemoPrice(lowestOffer.price)}</span>
            <DemoBadge />
          </div>
          <p className="product-card__seller">Lowest demo value · {lowestOffer.merchant}</p>
          <div className="product-card__footer">
            <span>Compare {product.offers.length} demo sellers</span>
            <span aria-hidden="true">↗</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
