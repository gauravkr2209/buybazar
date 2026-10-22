import { Suspense } from "react";
import ProductBrowser from "@/components/product-browser";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero__glow hero__glow--one" aria-hidden="true" />
        <div className="hero__glow hero__glow--two" aria-hidden="true" />
        <div className="hero__inner">
          <p className="eyebrow hero__eyebrow">
            <span className="eyebrow__dot" />
            A clearer way to choose
          </p>
          <h1>
            Good finds.
            <br />
            <span>Better decisions.</span>
          </h1>
          <p className="hero__copy">
            Compare thoughtfully, spot a price worth watching, and shop with a
            little more confidence.
          </p>
          <a className="button button--light" href="#discover">
            Explore the collection <span aria-hidden="true">↘</span>
          </a>
          <div className="hero__note">
            <span aria-hidden="true">✳</span>
            A design preview — every price and seller below is fictional demo
            data.
          </div>
        </div>
        <div className="hero__art" aria-hidden="true">
          <div className="hero__orbit hero__orbit--outer" />
          <div className="hero__orbit hero__orbit--inner" />
          <div className="hero__sun" />
          <div className="hero__spark hero__spark--one">✳</div>
          <div className="hero__spark hero__spark--two">✦</div>
          <div className="hero__card hero__card--back">
            <span>COMPARE</span>
            <strong>Take your time.</strong>
            <i />
            <i />
            <i />
          </div>
          <div className="hero__card hero__card--front">
            <span>YOUR NEXT GOOD FIND</span>
            <div className="hero__mini-product">
              <div className="hero__mini-phone">
                <i />
                <b />
              </div>
              <div>
                <strong>Something just right.</strong>
                <small>Worth a closer look</small>
              </div>
              <span className="hero__mini-arrow">↗</span>
            </div>
            <div className="hero__mini-rule" />
            <div className="hero__mini-footer">
              <span>Made for mindful shopping</span>
              <span className="hero__mini-star">✳</span>
            </div>
          </div>
          <div className="hero__floating hero__floating--top">Worth comparing</div>
          <div className="hero__floating hero__floating--bottom">Find your fit ↗</div>
        </div>
      </section>

      <section className="trust-strip" aria-label="How PaisaPath helps">
        <div className="trust-strip__item">
          <span className="trust-strip__icon trust-strip__icon--green" aria-hidden="true">
            ↗
          </span>
          <span>
            <strong>Compare in one place</strong>
            <small>Less tab-hopping, more clarity</small>
          </span>
        </div>
        <div className="trust-strip__divider" />
        <div className="trust-strip__item">
          <span className="trust-strip__icon trust-strip__icon--peach" aria-hidden="true">
            ◷
          </span>
          <span>
            <strong>See the bigger picture</strong>
            <small>Price history at a glance</small>
          </span>
        </div>
        <div className="trust-strip__divider" />
        <div className="trust-strip__item">
          <span className="trust-strip__icon trust-strip__icon--lavender" aria-hidden="true">
            ♡
          </span>
          <span>
            <strong>Shop at your pace</strong>
            <small>Your shortlist, your call</small>
          </span>
        </div>
      </section>

      <Suspense fallback={<div className="route-loading">Loading demo products…</div>}>
        <ProductBrowser />
      </Suspense>

      <section className="closing-note">
        <span className="closing-note__symbol" aria-hidden="true">✳</span>
        <div>
          <h2>Thoughtful shopping starts with good information.</h2>
          <p>
            PaisaPath is a concept storefront. All products, sellers, prices,
            and price-history points shown here are fictional demo data.
          </p>
        </div>
        <a href="#top" className="closing-note__link">
          Back to top <span aria-hidden="true">↑</span>
        </a>
      </section>
    </main>
  );
}
