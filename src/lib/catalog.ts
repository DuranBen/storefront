// Storefront types, helpers and editorial content. Product data itself lives
// in the database (see ./products.ts). Images are Unsplash photos, referenced
// by their photo id. Keep this file free of `db` imports: client components use it.

export type Img = {
  id: string;
  alt: string;
  /** CSS object-position, for photos whose subject isn't centred. */
  position?: string;
  /**
   * Zoomed 3:4 crop around a focal point (0–1 of the original photo),
   * used for close-up gallery shots cut from the same photo.
   */
  focus?: { x: number; y: number; zoom: number };
};

export type Product = {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  image: Img;
  /** Extra gallery shots shown on the product page after `image`. */
  gallery?: Img[];
  badge?: string;
  colour: string;
  description: string;
  details: string[];
  madeIn: string;
  /** Size run; omit for one-size items. `stock` is units left in that size. */
  sizes?: { label: string; stock: number }[];
  /** Units left for one-size items (sized items sum their sizes). */
  stock?: number;
};

export type Collection = {
  slug: string;
  title: string;
  image: Img;
};

export function unsplash(id: string, width = 2400) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;
}

/** Image URL, honouring a focal-point crop when the image defines one. */
export function imageSrc(image: Img, width = 2400) {
  if (!image.focus) return unsplash(image.id, width);
  const { x, y, zoom } = image.focus;
  return `${unsplash(image.id, width)}&h=${Math.round((width * 4) / 3)}&crop=focalpoint&fp-x=${x}&fp-y=${y}&fp-z=${zoom}`;
}

export type StockState =
  | { status: "in_stock" }
  | { status: "low_stock"; units: number }
  | { status: "out_of_stock" };

/** At or below this many units we tell shoppers stock is running low. */
const LOW_STOCK_THRESHOLD = 3;

export function stockUnits(product: Product) {
  return product.sizes
    ? product.sizes.reduce((sum, size) => sum + size.stock, 0)
    : (product.stock ?? 0);
}

export function stockState(units: number): StockState {
  if (units <= 0) return { status: "out_of_stock" };
  if (units <= LOW_STOCK_THRESHOLD) return { status: "low_stock", units };
  return { status: "in_stock" };
}

const priceFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number) {
  return priceFormat.format(amount);
}

export const hero = {
  eyebrow: "Autumn–Winter 2026",
  title: "The Quiet Season",
  body: "Soft tailoring, weathered wool and leather made to be lived in.",
  image: {
    id: "1539109136881-3be0616acf4b",
    alt: "A woman in a pale blue wool coat and scarf walking across a cathedral square",
    position: "50% 30%",
  },
} satisfies { eyebrow: string; title: string; body: string; image: Img };

export const collections: Collection[] = [
  {
    slug: "women",
    title: "Women",
    image: {
      id: "1566174053879-31528523f8ae",
      alt: "A model in an off-the-shoulder plum knit dress and drop earrings",
      position: "50% 20%",
    },
  },
  {
    slug: "men",
    title: "Men",
    image: {
      id: "1617127365659-c47fa864d8bc",
      alt: "A man in a black suit jacket and black shirt",
      position: "50% 25%",
    },
  },
  {
    slug: "accessories",
    title: "Accessories",
    image: {
      id: "1617922001439-4a2e6562f328",
      alt: "A woman in a wide-brimmed hat and sunglasses on a palm-lined street",
      position: "50% 20%",
    },
  },
  {
    slug: "shoes",
    title: "Shoes",
    image: {
      id: "1614252235316-8c857d38b5f4",
      alt: "Close-up of a polished brown leather lace-up shoe",
    },
  },
];

export const newArrivalSlugs = [
  "ribbed-knit-poncho",
  "shell-bomber-jacket",
  "printed-satin-pump",
  "suede-brogue",
  "round-metal-sunglasses",
  "pearl-strand-necklace",
  "sapphire-drop-earrings",
  "rose-gold-link-bracelet",
];

export const tailoringEdit = {
  eyebrow: "The Edit",
  title: "Tailoring, reconsidered",
  body: "Long camel coats and sharp, dark separates — cut generously and finished by hand for the colder months.",
  images: [
    {
      id: "1539533018447-63fcce2678e3",
      alt: "A woman in a long camel wrap coat standing on stone steps",
    },
    {
      id: "1550639525-c97d455acf70",
      alt: "A woman in a fitted black knit top and checked wrap skirt",
      position: "50% 35%",
    },
  ] satisfies Img[],
};

export const leatherGoods = {
  eyebrow: "Leather goods",
  title: "Carried every day",
  body: "Structured shapes in full-grain leather, built to soften and age with you.",
  image: {
    id: "1594223274512-ad4803739b7c",
    alt: "A teal leather top-handle bag beside a palm leaf and a straw hat",
  } satisfies Img,
  productSlugs: [
    "croc-effect-shoulder-bag",
    "chain-shoulder-bag",
    "structured-satchel",
    "leather-backpack",
  ],
};

export const eveningBanner = {
  eyebrow: "Occasionwear",
  title: "After Dark",
  body: "Fluid silhouettes in silk and satin for the evenings that matter.",
  image: {
    id: "1595777457583-95e059d581b8",
    alt: "A woman in a flowing red gown walking past a stone balustrade",
    position: "60% 50%",
  } satisfies Img,
};

export const services = [
  {
    title: "Complimentary delivery",
    body: "On every order, with tracked express shipping.",
  },
  {
    title: "Returns within 30 days",
    body: "Free collection from your door.",
  },
  {
    title: "Book an appointment",
    body: "Private styling, in store or by video.",
  },
  {
    title: "Signature gift wrapping",
    body: "Every piece arrives ready to give.",
  },
];

export const menuLinks = [
  { label: "New In", href: "/new" },
  ...collections.map((c) => ({ label: c.title, href: `/collections/${c.slug}` })),
  { label: "Jewellery", href: "/collections/jewellery" },
  { label: "Gifts", href: "/gifts" },
];
