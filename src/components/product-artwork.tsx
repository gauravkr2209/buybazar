import type { ProductArt } from "@/mocks/products";

type ProductArtworkProps = {
  art: ProductArt;
  finish: string;
  idPrefix: string;
};

export default function ProductArtwork({ art, finish, idPrefix }: ProductArtworkProps) {
  return (
    <svg
      className="product-artwork"
      viewBox="0 0 180 180"
      role="img"
      aria-label={`Illustration of a ${finish} ${art}`}
    >
      {art === "phone" && (
        <g transform="rotate(-8 90 90)">
          <rect x="48" y="17" width="84" height="146" rx="16" fill="#34463a" />
          <rect x="52" y="21" width="76" height="138" rx="13" fill="#bfd0b5" />
          <rect x="57" y="26" width="66" height="128" rx="10" fill={`url(#${idPrefix}-phone-glass)`} />
          <path d="M58 120c17-26 25-47 39-54 9-5 18-3 26-12v99H58z" fill="#8ba283" opacity=".66" />
          <path d="M59 132c17-17 29-25 43-24 7 1 14 4 21 2v44H59z" fill="#dce6ce" opacity=".74" />
          <rect x="77" y="28" width="26" height="6" rx="3" fill="#354239" />
          <circle cx="65" cy="40" r="5" fill="#34463a" />
          <circle cx="65" cy="40" r="2.5" fill="#9cb18e" />
          <circle cx="78" cy="40" r="5" fill="#34463a" />
          <circle cx="78" cy="40" r="2.5" fill="#9cb18e" />
          <defs>
            <linearGradient id={`${idPrefix}-phone-glass`} x1="58" y1="27" x2="122" y2="153" gradientUnits="userSpaceOnUse">
              <stop stopColor="#d6e3c9" />
              <stop offset="1" stopColor="#a9bca1" />
            </linearGradient>
          </defs>
        </g>
      )}
      {art === "laptop" && (
        <g>
          <path d="M53 34c0-4 3-7 7-7h60c4 0 7 3 7 7v83H53z" fill="#68766e" />
          <rect x="58" y="33" width="64" height="75" rx="2" fill={`url(#${idPrefix}-laptop-screen)`} />
          <path d="M58 96c18-20 33-26 64-22v34H58z" fill="#d6e0d0" opacity=".62" />
          <path d="M42 116h96l15 17c2 3-1 7-5 7H33c-4 0-6-4-3-7z" fill="#aab6ae" />
          <path d="M68 119h44l5 5H63z" fill="#8d9a91" />
          <path d="M81 134h18" stroke="#75847a" strokeWidth="2" strokeLinecap="round" />
          <defs>
            <linearGradient id={`${idPrefix}-laptop-screen`} x1="57" y1="32" x2="122" y2="111" gradientUnits="userSpaceOnUse">
              <stop stopColor="#dce7d8" />
              <stop offset="1" stopColor="#a7c0b3" />
            </linearGradient>
          </defs>
        </g>
      )}
      {art === "headphones" && (
        <g>
          <path d="M43 94V78c0-27 21-49 47-49s47 22 47 49v16" fill="none" stroke="#9b6555" strokeWidth="13" strokeLinecap="round" />
          <path d="M49 77c0-23 18-41 41-41s41 18 41 41" fill="none" stroke="#cf9a83" strokeWidth="7" strokeLinecap="round" />
          <rect x="35" y="78" width="29" height="57" rx="13" fill="#b77863" />
          <rect x="39" y="83" width="20" height="47" rx="10" fill="#d9a48c" />
          <rect x="116" y="78" width="29" height="57" rx="13" fill="#b77863" />
          <rect x="121" y="83" width="20" height="47" rx="10" fill="#d9a48c" />
          <path d="M51 91v29M129 91v29" stroke="#e4b6a0" strokeWidth="2" strokeLinecap="round" opacity=".7" />
        </g>
      )}
      {art === "watch" && (
        <g transform="rotate(-8 90 90)">
          <path d="M72 26c0-5 4-9 9-9h18c5 0 9 4 9 9l4 32H68z" fill="#7194a3" />
          <path d="M68 122h44l-4 32c0 5-4 9-9 9H81c-5 0-9-4-9-9z" fill="#7194a3" />
          <path d="M74 33h32l3 20H71zM71 127h38l-3 20H74z" fill="#8eacb7" />
          <rect x="48" y="52" width="84" height="78" rx="23" fill="#35444a" />
          <rect x="53" y="57" width="74" height="68" rx="19" fill="#182a31" />
          <rect x="59" y="63" width="62" height="56" rx="14" fill={`url(#${idPrefix}-watch-face)`} />
          <path d="M90 74v18l14 8" stroke="#f1e6ce" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="90" cy="91" r="3" fill="#e7b274" />
          <defs>
            <linearGradient id={`${idPrefix}-watch-face`} x1="59" y1="63" x2="121" y2="119" gradientUnits="userSpaceOnUse">
              <stop stopColor="#405c5d" />
              <stop offset="1" stopColor="#243a42" />
            </linearGradient>
          </defs>
        </g>
      )}
      {art === "speaker" && (
        <g transform="rotate(5 90 90)">
          <rect x="43" y="46" width="94" height="94" rx="27" fill="#d4cbb5" />
          <rect x="48" y="51" width="84" height="84" rx="23" fill="#e2dac7" />
          <rect x="53" y="57" width="74" height="72" rx="20" fill={`url(#${idPrefix}-speaker-cloth)`} />
          <path d="M66 67v51M73 64v58M80 62v62M87 61v64M94 61v64M101 62v62M108 64v58M115 68v50" stroke="#a79c82" strokeWidth="1.4" opacity=".65" />
          <circle cx="90" cy="92" r="14" fill="#e4dac5" opacity=".8" />
          <circle cx="90" cy="92" r="7" fill="#a99f88" opacity=".7" />
          <circle cx="90" cy="92" r="3" fill="#f4eddd" />
          <circle cx="90" cy="121" r="2" fill="#6c8769" />
          <defs>
            <linearGradient id={`${idPrefix}-speaker-cloth`} x1="52" y1="57" x2="126" y2="130" gradientUnits="userSpaceOnUse">
              <stop stopColor="#e8e0cf" />
              <stop offset="1" stopColor="#c9bea7" />
            </linearGradient>
          </defs>
        </g>
      )}
    </svg>
  );
}
