export const productCategories = [
  "Smartphones",
  "Laptops",
  "Headphones and earbuds",
  "Smartwatches",
  "TVs and monitors",
  "Tablets",
  "Computer accessories",
  "Home appliances",
  "Kitchen appliances",
  "Fashion and footwear",
  "Beauty and grooming",
  "Home and furniture",
  "Cameras and gaming",
] as const;

export type ProductCategory = (typeof productCategories)[number];
export function categorySlug(category: ProductCategory): string {
  return category.toLocaleLowerCase("en-IN").replace(/\s+/g, "-");
}
export type ProductArt =
  | "phone"
  | "laptop"
  | "headphones"
  | "watch"
  | "speaker";
export type DemoStatus = "DEMO";

export type PriceObservation = {
  date: string;
  price: number;
  status: DemoStatus;
};

export type DemoOffer = {
  id: string;
  merchant: string;
  price: number;
  currency: "INR";
  status: DemoStatus;
  sourceLabel: "Fictional demo seller";
  delivery: null;
  availability: null;
  url: null;
};

export type DemoProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  art: ProductArt;
  artBackground: string;
  finish: string;
  variant: string;
  specifications: string[];
  description: string;
  dataStatus: DemoStatus;
  offers: DemoOffer[];
  priceHistory: PriceObservation[];
};

type ProductSeed = {
  model: string;
  brand: string;
  variant: string;
  specs: string[];
  art?: ProductArt;
  finish: string;
  background: string;
  legacySlug?: string;
};

const catalogSeeds: Record<ProductCategory, ProductSeed[]> = {
  Smartphones: [
    { model: "Aster One 5G", brand: "Aster", variant: "128 GB · Sage", specs: ["128 GB storage", "5G-ready"], finish: "Sage / 128 GB", background: "#edf1e7", legacySlug: "aster-one-5g" },
    { model: "Paper Sky 5G", brand: "Paper Sky", variant: "256 GB · Lilac", specs: ["256 GB storage", "5G-ready"], finish: "Lilac / 256 GB", background: "#eeeaf3", legacySlug: "paper-sky-5g" },
    { model: "Aster One Plus", brand: "Aster", variant: "256 GB · Fern", specs: ["256 GB storage", "Large-format display"], finish: "Fern / 256 GB", background: "#e9eee3" },
    { model: "Morrow Pocket", brand: "Morrow", variant: "128 GB · Cloud", specs: ["128 GB storage", "Compact format"], finish: "Cloud / 128 GB", background: "#e9efee" },
    { model: "Serein Studio", brand: "Serein", variant: "512 GB · Graphite", specs: ["512 GB storage", "High-capacity variant"], finish: "Graphite / 512 GB", background: "#eeeae3" },
    { model: "Kite Fold", brand: "Kite", variant: "256 GB · Clay", specs: ["256 GB storage", "Foldable format"], finish: "Clay / 256 GB", background: "#f0e9e4" },
    { model: "Aster Mini", brand: "Aster", variant: "128 GB · Mint", specs: ["128 GB storage", "Compact format"], finish: "Mint / 128 GB", background: "#edf1e7" },
    { model: "Monsoon Max", brand: "Monsoon", variant: "256 GB · Storm", specs: ["256 GB storage", "Large-format display"], finish: "Storm / 256 GB", background: "#e8edf0" },
    { model: "Paper Sky Lite", brand: "Paper Sky", variant: "128 GB · Oat", specs: ["128 GB storage", "Lightweight format"], finish: "Oat / 128 GB", background: "#f0eee3" },
    { model: "Morrow Wide", brand: "Morrow", variant: "256 GB · Rose", specs: ["256 GB storage", "Wide display format"], finish: "Rose / 256 GB", background: "#f0e9e4" },
    { model: "Serein Edge", brand: "Serein", variant: "512 GB · Blue", specs: ["512 GB storage", "Edge display format"], finish: "Blue / 512 GB", background: "#e8edf0" },
    { model: "Kite Daylight", brand: "Kite", variant: "128 GB · Butter", specs: ["128 GB storage", "Everyday format"], finish: "Butter / 128 GB", background: "#f0eee3" },
    { model: "Aster Field", brand: "Aster", variant: "256 GB · Moss", specs: ["256 GB storage", "5G-ready"], finish: "Moss / 256 GB", background: "#e9eee3" },
    { model: "Monsoon Airphone", brand: "Monsoon", variant: "128 GB · Mist", specs: ["128 GB storage", "Lightweight format"], finish: "Mist / 128 GB", background: "#e9efee" },
    { model: "Paper Sky Pro", brand: "Paper Sky", variant: "512 GB · Ink", specs: ["512 GB storage", "High-capacity variant"], finish: "Ink / 512 GB", background: "#eeeaf3" },
  ],
  Laptops: [
    { model: "Monsoon Air 14", brand: "Monsoon", variant: "16 GB / 512 GB · Silver", specs: ["16 GB memory", "512 GB storage", "14-inch class"], finish: "Cloud silver", background: "#eeeae3", legacySlug: "monsoon-air-14" },
    { model: "Daybreak Mini", brand: "Daybreak", variant: "16 GB / 512 GB · Mist", specs: ["16 GB memory", "512 GB storage", "13-inch class"], finish: "Mist / 16 GB", background: "#e9efee", legacySlug: "daybreak-mini-laptop" },
    { model: "Aster Book 13", brand: "Aster", variant: "16 GB / 1 TB · Sage", specs: ["16 GB memory", "1 TB storage", "13-inch class"], finish: "Sage", background: "#edf1e7" },
    { model: "Morrow Work 15", brand: "Morrow", variant: "16 GB / 512 GB · Slate", specs: ["16 GB memory", "512 GB storage", "15-inch class"], finish: "Slate", background: "#e8edf0" },
    { model: "Serein Note 14", brand: "Serein", variant: "32 GB / 1 TB · Graphite", specs: ["32 GB memory", "1 TB storage", "14-inch class"], finish: "Graphite", background: "#eeeae3" },
    { model: "Kite Canvas 16", brand: "Kite", variant: "16 GB / 1 TB · Blue", specs: ["16 GB memory", "1 TB storage", "16-inch class"], finish: "Blue", background: "#e8edf0" },
    { model: "Paper Sky Book", brand: "Paper Sky", variant: "8 GB / 512 GB · Cloud", specs: ["8 GB memory", "512 GB storage", "13-inch class"], finish: "Cloud", background: "#eeeaf3" },
    { model: "Aster Studio 16", brand: "Aster", variant: "32 GB / 1 TB · Fern", specs: ["32 GB memory", "1 TB storage", "16-inch class"], finish: "Fern", background: "#e9eee3" },
    { model: "Monsoon Flex 14", brand: "Monsoon", variant: "16 GB / 512 GB · Pearl", specs: ["16 GB memory", "512 GB storage", "Convertible format"], finish: "Pearl", background: "#f0eee3" },
    { model: "Daybreak Go", brand: "Daybreak", variant: "8 GB / 256 GB · Oat", specs: ["8 GB memory", "256 GB storage", "13-inch class"], finish: "Oat", background: "#f0eee3" },
    { model: "Morrow Creator 15", brand: "Morrow", variant: "32 GB / 1 TB · Ink", specs: ["32 GB memory", "1 TB storage", "15-inch class"], finish: "Ink", background: "#e8edf0" },
    { model: "Serein Field 14", brand: "Serein", variant: "16 GB / 1 TB · Moss", specs: ["16 GB memory", "1 TB storage", "14-inch class"], finish: "Moss", background: "#edf1e7" },
  ],
  "Headphones and earbuds": [
    { model: "Drift Studio Wireless", brand: "Drift", variant: "Wireless · Terracotta", specs: ["Over-ear style", "Wireless demo variant"], finish: "Terracotta / wireless", background: "#f0e9e4", legacySlug: "drift-studio-headphones" },
    { model: "Morrow Quiet Buds", brand: "Morrow", variant: "In-ear · Cloud", specs: ["In-ear style", "Wireless demo variant"], finish: "Cloud", background: "#e9efee" },
    { model: "Aster Sound Loop", brand: "Aster", variant: "On-ear · Sage", specs: ["On-ear style", "Wireless demo variant"], finish: "Sage", background: "#edf1e7" },
    { model: "Serein Studio Max", brand: "Serein", variant: "Over-ear · Graphite", specs: ["Over-ear style", "Wired demo variant"], finish: "Graphite", background: "#eeeae3" },
    { model: "Kite Pocket Buds", brand: "Kite", variant: "In-ear · Lilac", specs: ["In-ear style", "Compact case variant"], finish: "Lilac", background: "#eeeaf3" },
    { model: "Daybreak Open Air", brand: "Daybreak", variant: "Open-ear · Blue", specs: ["Open-ear style", "Wireless demo variant"], finish: "Blue", background: "#e8edf0" },
    { model: "Paper Sky Mini Buds", brand: "Paper Sky", variant: "In-ear · Oat", specs: ["In-ear style", "Compact case variant"], finish: "Oat", background: "#f0eee3" },
    { model: "Drift Wired Classic", brand: "Drift", variant: "On-ear · Clay", specs: ["On-ear style", "Wired demo variant"], finish: "Clay", background: "#f0e9e4" },
    { model: "Monsoon Sound Pods", brand: "Monsoon", variant: "In-ear · Mint", specs: ["In-ear style", "Wireless demo variant"], finish: "Mint", background: "#e9eee3" },
    { model: "Aster Studio Buds", brand: "Aster", variant: "In-ear · Rose", specs: ["In-ear style", "Wireless demo variant"], finish: "Rose", background: "#f0e9e4" },
  ],
  Smartwatches: [
    { model: "Tide Loop Watch", brand: "Tide", variant: "42 mm · Ocean blue", specs: ["42 mm case class", "Silicone-style band"], finish: "Ocean blue", background: "#e8edf0", legacySlug: "tide-loop-watch" },
    { model: "Aster Time 40", brand: "Aster", variant: "40 mm · Sage", specs: ["40 mm case class", "Interchangeable-band format"], finish: "Sage", background: "#edf1e7" },
    { model: "Morrow Pace", brand: "Morrow", variant: "44 mm · Graphite", specs: ["44 mm case class", "Sport-style band"], finish: "Graphite", background: "#eeeae3" },
    { model: "Serein Round", brand: "Serein", variant: "42 mm · Rose", specs: ["42 mm case class", "Round display format"], finish: "Rose", background: "#f0e9e4" },
    { model: "Kite Active Mini", brand: "Kite", variant: "38 mm · Lilac", specs: ["38 mm case class", "Compact format"], finish: "Lilac", background: "#eeeaf3" },
    { model: "Daybreak Trail", brand: "Daybreak", variant: "46 mm · Moss", specs: ["46 mm case class", "Sport-style band"], finish: "Moss", background: "#e9eee3" },
    { model: "Paper Sky Watch", brand: "Paper Sky", variant: "40 mm · Cloud", specs: ["40 mm case class", "Lightweight format"], finish: "Cloud", background: "#e9efee" },
    { model: "Tide Loop Plus", brand: "Tide", variant: "44 mm · Slate", specs: ["44 mm case class", "Silicone-style band"], finish: "Slate", background: "#e8edf0" },
  ],
  "TVs and monitors": [
    { model: "Morrow View 32", brand: "Morrow", variant: "32-inch · Full HD class", specs: ["32-inch display class", "Full HD class"], finish: "Matte black", background: "#e8edf0" },
    { model: "Aster Panel 27", brand: "Aster", variant: "27-inch · QHD class", specs: ["27-inch display class", "QHD class"], finish: "Cloud silver", background: "#e9efee" },
    { model: "Serein Screen 43", brand: "Serein", variant: "43-inch · 4K class", specs: ["43-inch display class", "4K class"], finish: "Graphite", background: "#eeeae3" },
    { model: "Kite Studio 24", brand: "Kite", variant: "24-inch · Full HD class", specs: ["24-inch display class", "Full HD class"], finish: "Oat", background: "#f0eee3" },
    { model: "Daybreak Wide 34", brand: "Daybreak", variant: "34-inch · Ultrawide class", specs: ["34-inch display class", "Ultrawide format"], finish: "Slate", background: "#e8edf0" },
    { model: "Monsoon Panel 55", brand: "Monsoon", variant: "55-inch · 4K class", specs: ["55-inch display class", "4K class"], finish: "Storm", background: "#e9efee" },
    { model: "Paper Sky Monitor 27", brand: "Paper Sky", variant: "27-inch · QHD class", specs: ["27-inch display class", "QHD class"], finish: "Lilac grey", background: "#eeeaf3" },
    { model: "Aster Living 50", brand: "Aster", variant: "50-inch · 4K class", specs: ["50-inch display class", "4K class"], finish: "Fern", background: "#edf1e7" },
  ],
  Tablets: [
    { model: "Paper Sky Tab 11", brand: "Paper Sky", variant: "128 GB · Cloud", specs: ["11-inch class", "128 GB storage"], finish: "Cloud", background: "#eeeaf3" },
    { model: "Aster Note Tab", brand: "Aster", variant: "256 GB · Sage", specs: ["11-inch class", "256 GB storage"], finish: "Sage", background: "#edf1e7" },
    { model: "Morrow Read 10", brand: "Morrow", variant: "128 GB · Oat", specs: ["10-inch class", "128 GB storage"], finish: "Oat", background: "#f0eee3" },
    { model: "Kite Sketch 12", brand: "Kite", variant: "256 GB · Blue", specs: ["12-inch class", "256 GB storage"], finish: "Blue", background: "#e8edf0" },
    { model: "Daybreak Tab Mini", brand: "Daybreak", variant: "64 GB · Mist", specs: ["8-inch class", "64 GB storage"], finish: "Mist", background: "#e9efee" },
    { model: "Serein Study 11", brand: "Serein", variant: "128 GB · Graphite", specs: ["11-inch class", "128 GB storage"], finish: "Graphite", background: "#eeeae3" },
    { model: "Monsoon Canvas Tab", brand: "Monsoon", variant: "256 GB · Fern", specs: ["12-inch class", "256 GB storage"], finish: "Fern", background: "#e9eee3" },
  ],
  "Computer accessories": [
    { model: "Aster Keyset 75", brand: "Aster", variant: "75-key · Sage", specs: ["75-key layout", "USB-C connection"], finish: "Sage", background: "#edf1e7" },
    { model: "Morrow Quiet Mouse", brand: "Morrow", variant: "Wireless · Graphite", specs: ["Wireless demo variant", "Compact shape"], finish: "Graphite", background: "#eeeae3" },
    { model: "Kite Desk Mic", brand: "Kite", variant: "USB · Cloud", specs: ["USB demo connection", "Desktop format"], finish: "Cloud", background: "#e9efee" },
    { model: "Serein Dock 8", brand: "Serein", variant: "8-port · Silver", specs: ["8-port layout", "USB-C host connection"], finish: "Silver", background: "#e8edf0" },
    { model: "Daybreak Pad XL", brand: "Daybreak", variant: "Large · Oat", specs: ["Large desk format", "Textile-style surface"], finish: "Oat", background: "#f0eee3" },
    { model: "Paper Sky Webcam", brand: "Paper Sky", variant: "1080p class · Lilac", specs: ["1080p class", "USB demo connection"], finish: "Lilac", background: "#eeeaf3" },
    { model: "Monsoon Keyset TKL", brand: "Monsoon", variant: "Tenkeyless · Storm", specs: ["Tenkeyless layout", "USB-C connection"], finish: "Storm", background: "#e8edf0" },
    { model: "Aster Track Mouse", brand: "Aster", variant: "Wireless · Fern", specs: ["Wireless demo variant", "Ergonomic shape"], finish: "Fern", background: "#e9eee3" },
    { model: "Morrow Screen Light", brand: "Morrow", variant: "Monitor bar · Warm", specs: ["Monitor-mounted format", "Adjustable light"], finish: "Warm", background: "#f0eee3" },
    { model: "Serein USB Hub", brand: "Serein", variant: "5-port · Slate", specs: ["5-port layout", "USB-C host connection"], finish: "Slate", background: "#e8edf0" },
  ],
  "Home appliances": [
    { model: "Little Cloud Room Speaker", brand: "Little Cloud", variant: "Compact · Oat", specs: ["Compact room format", "Fabric-style finish"], finish: "Oat / compact", background: "#f0eee3", legacySlug: "little-cloud-speaker" },
    { model: "Monsoon Air Purifier", brand: "Monsoon", variant: "Room · White", specs: ["Room appliance format", "Replaceable filter style"], finish: "White", background: "#e9efee" },
    { model: "Aster Floor Fan", brand: "Aster", variant: "16-inch class · Sage", specs: ["16-inch class", "Oscillating format"], finish: "Sage", background: "#edf1e7" },
    { model: "Morrow Vacuum Lite", brand: "Morrow", variant: "Cordless · Graphite", specs: ["Cordless demo variant", "Stick format"], finish: "Graphite", background: "#eeeae3" },
    { model: "Kite Room Heater", brand: "Kite", variant: "Compact · Clay", specs: ["Compact room format", "Portable demo variant"], finish: "Clay", background: "#f0e9e4" },
    { model: "Serein Dehumidifier", brand: "Serein", variant: "Room · Cloud", specs: ["Room appliance format", "Water tank design"], finish: "Cloud", background: "#e9efee" },
    { model: "Daybreak Garment Steamer", brand: "Daybreak", variant: "Handheld · Mist", specs: ["Handheld format", "Refillable reservoir"], finish: "Mist", background: "#e9efee" },
    { model: "Paper Sky Air Cooler", brand: "Paper Sky", variant: "Compact · Lilac", specs: ["Compact room format", "Portable demo variant"], finish: "Lilac", background: "#eeeaf3" },
    { model: "Aster Desk Fan", brand: "Aster", variant: "Tabletop · Fern", specs: ["Tabletop format", "Adjustable tilt"], finish: "Fern", background: "#e9eee3" },
    { model: "Morrow Stick Vacuum", brand: "Morrow", variant: "Cordless · Silver", specs: ["Cordless demo variant", "Stick format"], finish: "Silver", background: "#e8edf0" },
    { model: "Tide Laundry Care", brand: "Tide", variant: "Compact · Blue", specs: ["Compact appliance format", "Everyday household use"], finish: "Blue", background: "#e8edf0" },
    { model: "Little Cloud Humidifier", brand: "Little Cloud", variant: "Room · Oat", specs: ["Room appliance format", "Refillable tank design"], finish: "Oat", background: "#f0eee3" },
  ],
  "Kitchen appliances": [
    { model: "Aster Brew 08", brand: "Aster", variant: "8-cup class · Sage", specs: ["8-cup class", "Countertop format"], finish: "Sage", background: "#edf1e7" },
    { model: "Morrow Toast 2", brand: "Morrow", variant: "2-slice · Oat", specs: ["2-slice format", "Countertop appliance"], finish: "Oat", background: "#f0eee3" },
    { model: "Kite Mix Bowl", brand: "Kite", variant: "Stand mixer · Clay", specs: ["Stand mixer format", "Removable bowl"], finish: "Clay", background: "#f0e9e4" },
    { model: "Serein Blend Pro", brand: "Serein", variant: "Blender · Graphite", specs: ["Countertop blender format", "Multi-speed demo control"], finish: "Graphite", background: "#eeeae3" },
    { model: "Daybreak Rice Pot", brand: "Daybreak", variant: "1.8 L class · Mist", specs: ["1.8 L class", "Countertop cooker"], finish: "Mist", background: "#e9efee" },
    { model: "Paper Sky Air Fryer", brand: "Paper Sky", variant: "4 L class · Cloud", specs: ["4 L class", "Countertop cooker"], finish: "Cloud", background: "#e9efee" },
    { model: "Monsoon Kettle", brand: "Monsoon", variant: "1.5 L class · Storm", specs: ["1.5 L class", "Cordless jug format"], finish: "Storm", background: "#e8edf0" },
    { model: "Aster Mini Chopper", brand: "Aster", variant: "Compact · Fern", specs: ["Compact countertop format", "Removable bowl"], finish: "Fern", background: "#e9eee3" },
  ],
  "Fashion and footwear": [
    { model: "Daybreak Everyday Runner", brand: "Daybreak", variant: "Unisex · Sand", specs: ["Everyday sneaker style", "Textile upper demo"], finish: "Sand", background: "#f0eee3" },
    { model: "Morrow City Walker", brand: "Morrow", variant: "Unisex · Slate", specs: ["Walking shoe style", "Cushioned sole format"], finish: "Slate", background: "#e8edf0" },
    { model: "Kite Canvas Low", brand: "Kite", variant: "Unisex · Cloud", specs: ["Low-top style", "Canvas-look upper"], finish: "Cloud", background: "#e9efee" },
    { model: "Aster Weekend Tote", brand: "Aster", variant: "One size · Fern", specs: ["Everyday tote format", "Textile demo material"], finish: "Fern", background: "#e9eee3" },
    { model: "Paper Sky Crossbody", brand: "Paper Sky", variant: "One size · Lilac", specs: ["Crossbody format", "Adjustable strap style"], finish: "Lilac", background: "#eeeaf3" },
    { model: "Serein Daily Jacket", brand: "Serein", variant: "Unisex · Olive", specs: ["Light jacket style", "Layering format"], finish: "Olive", background: "#edf1e7" },
    { model: "Monsoon Walk Sandal", brand: "Monsoon", variant: "Unisex · Clay", specs: ["Everyday sandal style", "Adjustable strap format"], finish: "Clay", background: "#f0e9e4" },
    { model: "Tide Soft Slide", brand: "Tide", variant: "Unisex · Blue", specs: ["Slide sandal style", "Casual footwear format"], finish: "Blue", background: "#e8edf0" },
    { model: "Morrow Knit Layer", brand: "Morrow", variant: "Unisex · Oat", specs: ["Knit layer style", "Everyday wardrobe format"], finish: "Oat", background: "#f0eee3" },
    { model: "Daybreak Trail Shoe", brand: "Daybreak", variant: "Unisex · Moss", specs: ["Trail-inspired shoe style", "Textile upper demo"], finish: "Moss", background: "#e9eee3" },
  ],
  "Beauty and grooming": [
    { model: "Serein Skin Set", brand: "Serein", variant: "Daily · Cloud", specs: ["Daily care set format", "Fictional sample assortment"], finish: "Cloud", background: "#e9efee" },
    { model: "Aster Hair Dryer", brand: "Aster", variant: "Compact · Rose", specs: ["Handheld dryer format", "Foldable-handle style"], finish: "Rose", background: "#f0e9e4" },
    { model: "Morrow Groom Kit", brand: "Morrow", variant: "Rechargeable · Graphite", specs: ["Personal grooming format", "Rechargeable demo variant"], finish: "Graphite", background: "#eeeae3" },
    { model: "Kite Face Brush", brand: "Kite", variant: "Soft · Lilac", specs: ["Personal care accessory", "Soft-bristle demo style"], finish: "Lilac", background: "#eeeaf3" },
    { model: "Daybreak Straightener", brand: "Daybreak", variant: "Ceramic-style · Oat", specs: ["Hair styling format", "Ceramic-style plates"], finish: "Oat", background: "#f0eee3" },
    { model: "Paper Sky Trimmer", brand: "Paper Sky", variant: "Compact · Mist", specs: ["Personal grooming format", "Compact demo variant"], finish: "Mist", background: "#e9efee" },
    { model: "Serein Mirror Light", brand: "Serein", variant: "Desk · Sage", specs: ["Tabletop mirror format", "Adjustable light style"], finish: "Sage", background: "#edf1e7" },
    { model: "Aster Curl Wand", brand: "Aster", variant: "Styling · Clay", specs: ["Hair styling format", "Barrel-style tool"], finish: "Clay", background: "#f0e9e4" },
  ],
  "Home and furniture": [
    { model: "Little Cloud Reading Chair", brand: "Little Cloud", variant: "Single seat · Oat", specs: ["Single-seat format", "Upholstered demo style"], finish: "Oat", background: "#f0eee3" },
    { model: "Morrow Side Table", brand: "Morrow", variant: "Compact · Walnut tone", specs: ["Compact table format", "Two-tier demo design"], finish: "Walnut tone", background: "#eeeae3" },
    { model: "Aster Desk Light", brand: "Aster", variant: "Adjustable · Sage", specs: ["Desk lamp format", "Adjustable arm style"], finish: "Sage", background: "#edf1e7" },
    { model: "Kite Shelf Unit", brand: "Kite", variant: "3-tier · Cloud", specs: ["3-tier shelf format", "Freestanding demo design"], finish: "Cloud", background: "#e9efee" },
    { model: "Serein Floor Rug", brand: "Serein", variant: "Medium · Sand", specs: ["Medium rug format", "Woven-look demo surface"], finish: "Sand", background: "#f0eee3" },
    { model: "Daybreak Lounge Stool", brand: "Daybreak", variant: "Compact · Clay", specs: ["Compact seating format", "Padded demo style"], finish: "Clay", background: "#f0e9e4" },
    { model: "Paper Sky Storage Bench", brand: "Paper Sky", variant: "Entryway · Lilac grey", specs: ["Entryway bench format", "Lift-top demo design"], finish: "Lilac grey", background: "#eeeaf3" },
  ],
  "Cameras and gaming": [
    { model: "Aster Pocket Camera", brand: "Aster", variant: "Compact · Silver", specs: ["Compact camera format", "Interchangeable-mode demo"], finish: "Silver", background: "#e8edf0" },
    { model: "Morrow Play Pad", brand: "Morrow", variant: "Wireless · Fern", specs: ["Wireless controller format", "Dual-stick layout"], finish: "Fern", background: "#e9eee3" },
    { model: "Kite Capture 4K", brand: "Kite", variant: "Action camera · Graphite", specs: ["Action camera format", "4K-class demo label"], finish: "Graphite", background: "#eeeae3" },
    { model: "Serein Arcade Handheld", brand: "Serein", variant: "Portable · Lilac", specs: ["Portable gaming format", "Handheld controls"], finish: "Lilac", background: "#eeeaf3" },
    { model: "Daybreak Creator Cam", brand: "Daybreak", variant: "Mirrorless-style · Oat", specs: ["Creator camera format", "Interchangeable-lens style"], finish: "Oat", background: "#f0eee3" },
  ],
};

const demoMerchants = [
  "Northstar Demo Shop",
  "Cobalt Sample Market",
  "Little Lantern Demo",
  "Paper Kite Preview",
] as const;

const demoDates = [
  "2026-05-01",
  "2026-05-08",
  "2026-05-15",
  "2026-05-22",
  "2026-05-29",
  "2026-06-05",
  "2026-06-12",
];

const artForCategory: Record<ProductCategory, ProductArt> = {
  Smartphones: "phone",
  Laptops: "laptop",
  "Headphones and earbuds": "headphones",
  Smartwatches: "watch",
  "TVs and monitors": "laptop",
  Tablets: "phone",
  "Computer accessories": "speaker",
  "Home appliances": "speaker",
  "Kitchen appliances": "speaker",
  "Fashion and footwear": "speaker",
  "Beauty and grooming": "speaker",
  "Home and furniture": "speaker",
  "Cameras and gaming": "speaker",
};

function baseDemoPrice(category: ProductCategory, index: number): number {
  const bases: Record<ProductCategory, number> = {
    Smartphones: 18990,
    Laptops: 42990,
    "Headphones and earbuds": 2490,
    Smartwatches: 3990,
    "TVs and monitors": 7990,
    Tablets: 10990,
    "Computer accessories": 990,
    "Home appliances": 2490,
    "Kitchen appliances": 1490,
    "Fashion and footwear": 1290,
    "Beauty and grooming": 790,
    "Home and furniture": 1490,
    "Cameras and gaming": 3990,
  };
  return bases[category] + (index % 5) * 1370;
}

function createDemoOffers(basePrice: number, productId: string): DemoOffer[] {
  return demoMerchants.slice(0, 3).map((merchant, index) => ({
    id: `${productId}-demo-offer-${index + 1}`,
    merchant,
    price: basePrice + index * 350,
    currency: "INR",
    status: "DEMO",
    sourceLabel: "Fictional demo seller",
    delivery: null,
    availability: null,
    url: null,
  }));
}

function createDemoHistory(basePrice: number): PriceObservation[] {
  return demoDates.map((date, index) => ({
    date,
    price: basePrice + (6 - index) * 250 + (index % 2) * 100,
    status: "DEMO",
  }));
}

export const demoProducts: DemoProduct[] = productCategories.flatMap((category) =>
  catalogSeeds[category].map((seed, index) => {
    const slug = seed.legacySlug ?? `${category}-${seed.brand}-${seed.model}`
      .toLocaleLowerCase("en-IN")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const id = `demo-product-${slug}`;
    const price = baseDemoPrice(category, index);
    return {
      id,
      slug,
      name: seed.model.toLocaleLowerCase("en-IN").startsWith(
        seed.brand.toLocaleLowerCase("en-IN"),
      )
        ? seed.model
        : `${seed.brand} ${seed.model}`,
      brand: seed.brand,
      category,
      art: seed.art ?? artForCategory[category],
      artBackground: seed.background,
      finish: seed.finish,
      variant: seed.variant,
      specifications: seed.specs,
      description: `Fictional ${category.toLocaleLowerCase("en-IN")} catalogue entry. Product details are illustrative demo information and require verification before representing any real item.`,
      dataStatus: "DEMO",
      offers: createDemoOffers(price, id),
      priceHistory: createDemoHistory(price),
    };
  }),
);

export function formatDemoPrice(price: number): string {
  return `₹${new Intl.NumberFormat("en-IN").format(price)}`;
}

export function getLowestDemoOffer(product: DemoProduct): DemoOffer | undefined {
  return product.offers.reduce<DemoOffer | undefined>(
    (lowest, offer) => (!lowest || offer.price < lowest.price ? offer : lowest),
    undefined,
  );
}
