// Seed catalogue, moved from the original in-memory src/lib/products.ts.
// Gallery close-ups are focal-point crops of the same Unsplash photo.

import type { Product } from "../lib/catalog";

export type SeedProduct = Omit<Product, "categorySlug">;

export const categories = [
  { slug: "ready-to-wear", name: "Ready-to-wear" },
  { slug: "shoes", name: "Shoes" },
  { slug: "eyewear", name: "Eyewear" },
  { slug: "jewellery", name: "Jewellery" },
  { slug: "handbags", name: "Handbags" },
  { slug: "bags", name: "Bags" },
];

const apparelSizes = (stock: [number, number, number, number, number]) =>
  ["XS", "S", "M", "L", "XL"].map((label, i) => ({ label, stock: stock[i] }));

export const products: SeedProduct[] = [
  {
    slug: "ribbed-knit-poncho",
    name: "Ribbed Knit Poncho",
    category: "Ready-to-wear",
    price: 1250,
    badge: "New",
    colour: "Ivory",
    image: {
      id: "1434389677669-e08b4cac3105",
      alt: "Cream open-knit poncho with fringed hem on a wooden hanger",
    },
    gallery: [
      {
        id: "1434389677669-e08b4cac3105",
        alt: "Close-up of the open knit stitch",
        focus: { x: 0.5, y: 0.45, zoom: 2.5 },
      },
      {
        id: "1434389677669-e08b4cac3105",
        alt: "Close-up of the hand-knotted fringe at the hem",
        focus: { x: 0.5, y: 0.8, zoom: 2.2 },
      },
    ],
    description:
      "An open-stitch poncho knitted from a soft cotton and cashmere blend, finished with a hand-knotted fringe. Drape it over tailoring or a slip dress as the evenings cool.",
    details: [
      "70% cotton, 30% cashmere",
      "Open-stitch knit with V-neck",
      "Hand-knotted fringe hem",
      "Relaxed, one-piece silhouette",
      "Dry clean only",
    ],
    madeIn: "Italy",
    sizes: apparelSizes([2, 5, 4, 0, 1]),
  },
  {
    slug: "shell-bomber-jacket",
    name: "Shell Bomber Jacket",
    category: "Ready-to-wear",
    price: 1890,
    badge: "New",
    colour: "Rust",
    image: {
      id: "1591047139829-d91aecb6caea",
      alt: "Rust-coloured bomber jacket held up on a hanger",
    },
    gallery: [
      {
        id: "1591047139829-d91aecb6caea",
        alt: "Close-up of the ribbed collar and zip",
        focus: { x: 0.5, y: 0.3, zoom: 2.4 },
      },
      {
        id: "1591047139829-d91aecb6caea",
        alt: "Close-up of the ribbed hem and side pocket",
        focus: { x: 0.5, y: 0.78, zoom: 2.2 },
      },
    ],
    description:
      "A lightweight bomber in technical silk-touch shell with ribbed trims and a two-way zip. Cut slightly cropped to sit well over knitwear.",
    details: [
      "Outer: 100% recycled polyamide",
      "Lining: 100% cupro",
      "Two-way metal zip",
      "Ribbed collar, cuffs and hem",
      "Interior zip pocket",
    ],
    madeIn: "Portugal",
    sizes: apparelSizes([0, 1, 1, 1, 0]),
  },
  {
    slug: "printed-satin-pump",
    name: "Printed Satin Pump",
    category: "Shoes",
    price: 875,
    colour: "Cobalt floral",
    image: {
      id: "1543163521-1bf539c55dd2",
      alt: "Pair of floral-print pointed stiletto pumps against a pale blue wall",
    },
    gallery: [
      {
        id: "1543163521-1bf539c55dd2",
        alt: "Close-up of the floral satin print",
        focus: { x: 0.52, y: 0.32, zoom: 2.4 },
      },
      {
        id: "1543163521-1bf539c55dd2",
        alt: "Close-up of the pointed toe and stiletto heel",
        focus: { x: 0.48, y: 0.68, zoom: 2.2 },
      },
    ],
    description:
      "A pointed pump in printed duchess satin on a slender 95mm stiletto. Leather-lined and cushioned for an evening on your feet.",
    details: [
      "Printed silk-blend satin upper",
      "Leather lining and sole",
      "95mm stiletto heel",
      "Padded insole",
      "Comes with dust bags",
    ],
    madeIn: "Italy",
    sizes: ["36", "37", "38", "39", "40", "41"].map((label, i) => ({
      label,
      stock: [3, 4, 6, 2, 0, 1][i],
    })),
  },
  {
    slug: "suede-brogue",
    name: "Suede Brogue",
    category: "Shoes",
    price: 790,
    colour: "Teal",
    image: {
      id: "1560343090-f0409e92791a",
      alt: "Teal suede brogue on a blush pink plinth",
    },
    gallery: [
      {
        id: "1560343090-f0409e92791a",
        alt: "Close-up of the punched brogue detailing on the toe",
        focus: { x: 0.62, y: 0.52, zoom: 2.4 },
      },
      {
        id: "1560343090-f0409e92791a",
        alt: "Close-up of the heel and leather sole",
        focus: { x: 0.42, y: 0.55, zoom: 2.6 },
      },
    ],
    description:
      "A laceless brogue in brushed suede with traditional punched detailing. Goodyear-welted on a leather sole so it can be resoled for years.",
    details: [
      "Calf suede upper",
      "Leather lining",
      "Goodyear-welted leather sole",
      "Punched wingtip detailing",
      "Slip-on construction",
    ],
    madeIn: "England",
    sizes: ["40", "41", "42", "43", "44", "45"].map((label, i) => ({
      label,
      stock: [2, 3, 5, 4, 2, 1][i],
    })),
  },
  {
    slug: "round-metal-sunglasses",
    name: "Round Metal Sunglasses",
    category: "Eyewear",
    price: 460,
    badge: "New",
    colour: "Gold / bottle green",
    image: {
      id: "1511499767150-a48a237f0083",
      alt: "Round gold-frame sunglasses with dark green lenses on white",
    },
    gallery: [
      {
        id: "1511499767150-a48a237f0083",
        alt: "Close-up of the green mineral glass lens",
        focus: { x: 0.38, y: 0.5, zoom: 2.6 },
      },
      {
        id: "1511499767150-a48a237f0083",
        alt: "Close-up of the keyhole bridge",
        focus: { x: 0.5, y: 0.45, zoom: 3 },
      },
    ],
    description:
      "Fine round frames in gold-plated titanium with green mineral-glass lenses. Light enough to forget you're wearing them.",
    details: [
      "Gold-plated titanium frame",
      "Mineral glass lenses, category 3",
      "100% UV protection",
      "Adjustable nose pads",
      "Leather case included",
    ],
    madeIn: "Japan",
    stock: 12,
  },
  {
    slug: "pearl-strand-necklace",
    name: "Pearl Strand Necklace",
    category: "Jewellery",
    price: 1450,
    colour: "White pearl / silver",
    image: {
      id: "1515562141207-7a88fb7ce338",
      alt: "Pearl necklace resting in an open red jewellery box",
    },
    gallery: [
      {
        id: "1515562141207-7a88fb7ce338",
        alt: "Close-up of the pavé rose clasp",
        focus: { x: 0.4, y: 0.65, zoom: 1.8 },
      },
      {
        id: "1515562141207-7a88fb7ce338",
        alt: "Close-up of the hand-knotted pearl strand",
        focus: { x: 0.55, y: 0.6, zoom: 1.6 },
      },
    ],
    description:
      "A single strand of hand-knotted freshwater pearls, each chosen for lustre, fastened with a pavé-set silver rose clasp.",
    details: [
      "Freshwater pearls, 7–7.5mm",
      "Hand-knotted on silk thread",
      "Pavé-set sterling silver rose clasp",
      "Length 45cm",
      "Presented in a gift box",
    ],
    madeIn: "Italy",
    stock: 0,
  },
  {
    slug: "sapphire-drop-earrings",
    name: "Sapphire Drop Earrings",
    category: "Jewellery",
    price: 2300,
    colour: "Blue / silver",
    image: {
      id: "1535632066927-ab7c9ab60908",
      alt: "Pair of blue stone drop earrings laid on a green leaf",
    },
    gallery: [
      {
        id: "1535632066927-ab7c9ab60908",
        alt: "Close-up of one earring's blue centre stone",
        focus: { x: 0.36, y: 0.42, zoom: 2.6 },
      },
      {
        id: "1535632066927-ab7c9ab60908",
        alt: "Close-up of the second earring and its setting",
        focus: { x: 0.64, y: 0.58, zoom: 2.6 },
      },
    ],
    description:
      "Statement drops with a lab-grown sapphire framed by a halo of white topaz, set in rhodium-plated sterling silver.",
    details: [
      "Lab-grown sapphire centre stones",
      "White topaz halo",
      "Rhodium-plated sterling silver",
      "Post back with butterfly fastening",
      "Drop length 4.5cm",
    ],
    madeIn: "France",
    stock: 2,
  },
  {
    slug: "rose-gold-link-bracelet",
    name: "Rose Gold Link Bracelet",
    category: "Jewellery",
    price: 980,
    colour: "Rose gold",
    image: {
      id: "1611591437281-460bfbe1220a",
      alt: "Rose gold filigree link bracelet on a pale pink surface",
    },
    gallery: [
      {
        id: "1611591437281-460bfbe1220a",
        alt: "Close-up of the filigree links",
        focus: { x: 0.5, y: 0.5, zoom: 2.6 },
      },
      {
        id: "1611591437281-460bfbe1220a",
        alt: "Close-up of the bracelet's crystal-set links",
        focus: { x: 0.3, y: 0.5, zoom: 3 },
      },
    ],
    description:
      "Openwork filigree links set with tiny crystals, in 18k rose gold vermeil. Wear it alone or stacked.",
    details: [
      "18k rose gold vermeil over sterling silver",
      "Crystal-set filigree links",
      "Lobster clasp",
      "Length 17cm with 2cm extender",
    ],
    madeIn: "Italy",
    stock: 8,
  },
  {
    slug: "croc-effect-shoulder-bag",
    name: "Croc-Effect Shoulder Bag",
    category: "Handbags",
    price: 2650,
    colour: "Bordeaux",
    image: {
      id: "1575032617751-6ddec2089882",
      alt: "Burgundy croc-effect leather bag with a gold clasp, held by its strap",
    },
    gallery: [
      {
        id: "1575032617751-6ddec2089882",
        alt: "Close-up of the sculpted gold clasp",
        focus: { x: 0.57, y: 0.52, zoom: 2.6 },
      },
      {
        id: "1575032617751-6ddec2089882",
        alt: "Close-up of the embossed croc-effect leather",
        focus: { x: 0.55, y: 0.72, zoom: 3 },
      },
    ],
    description:
      "A compact shoulder bag in glossy croc-embossed calfskin, closed with a sculpted gold-tone clasp. Fits a phone, cards and keys.",
    details: [
      "Croc-embossed calf leather",
      "Suede lining with card slot",
      "Gold-tone brass hardware",
      "Fixed shoulder strap, 45cm drop",
      "W 17 × H 21 × D 6cm",
    ],
    madeIn: "Italy",
    stock: 5,
  },
  {
    slug: "chain-shoulder-bag",
    name: "Chain Shoulder Bag",
    category: "Handbags",
    price: 1890,
    badge: "Exclusive",
    colour: "Blush",
    image: {
      id: "1566150905458-1bf1fc113f0d",
      alt: "Pink leather shoulder bag with a chevron stripe and chain strap",
    },
    gallery: [
      {
        id: "1566150905458-1bf1fc113f0d",
        alt: "Close-up of the inlaid chevron stripe",
        focus: { x: 0.45, y: 0.4, zoom: 2.2 },
      },
      {
        id: "1566150905458-1bf1fc113f0d",
        alt: "Close-up of the sliding chain strap",
        focus: { x: 0.66, y: 0.5, zoom: 1.7 },
      },
    ],
    description:
      "A structured flap bag in smooth calfskin with an inlaid chevron stripe. The sliding chain strap wears on the shoulder or across the body.",
    details: [
      "Smooth calf leather with leather inlay",
      "Magnetic flap closure",
      "Sliding chain strap, 55cm drop",
      "Interior slip pocket",
      "W 22 × H 14 × D 7cm",
    ],
    madeIn: "Italy",
    stock: 1,
  },
  {
    slug: "structured-satchel",
    name: "Structured Satchel",
    category: "Handbags",
    price: 1980,
    colour: "Dove grey",
    image: {
      id: "1605733513597-a8f8341084e6",
      alt: "Grey leather satchel with twin buckle straps",
    },
    gallery: [
      {
        id: "1605733513597-a8f8341084e6",
        alt: "Close-up of the brass buckle straps",
        focus: { x: 0.65, y: 0.65, zoom: 2.6 },
      },
      {
        id: "1605733513597-a8f8341084e6",
        alt: "Close-up of the top handle and stitching",
        focus: { x: 0.5, y: 0.38, zoom: 2.6 },
      },
    ],
    description:
      "A classic satchel in pebbled leather with twin buckle straps and a rolled top handle. Detachable strap for crossbody wear.",
    details: [
      "Pebbled calf leather",
      "Cotton twill lining",
      "Brass buckle and magnetic closures",
      "Detachable, adjustable strap",
      "W 26 × H 19 × D 9cm",
    ],
    madeIn: "Spain",
    stock: 9,
  },
  {
    slug: "leather-backpack",
    name: "Leather Backpack",
    category: "Bags",
    price: 2150,
    colour: "Cognac",
    image: {
      id: "1622560480605-d83c853bc5c3",
      alt: "Tan leather backpack with a front pocket",
    },
    gallery: [
      {
        id: "1622560480605-d83c853bc5c3",
        alt: "Close-up of the top handle and embossed leather patch",
        focus: { x: 0.5, y: 0.4, zoom: 2.2 },
      },
      {
        id: "1622560480605-d83c853bc5c3",
        alt: "Close-up of the zipped front pocket",
        focus: { x: 0.5, y: 0.75, zoom: 2.2 },
      },
    ],
    description:
      "A softly structured backpack in waxed full-grain leather that darkens beautifully with wear. A padded sleeve takes a 14-inch laptop.",
    details: [
      "Waxed full-grain cow leather",
      "Padded laptop sleeve, fits 14\"",
      "Zipped front pocket",
      "Adjustable padded straps",
      "W 30 × H 40 × D 13cm",
    ],
    madeIn: "Italy",
    stock: 0,
  },
];
