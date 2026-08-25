import type { StorefrontProduct } from "@/lib/storefront-data";

export type MerchantProductRecord = {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink?: string;
  availability: "in_stock" | "out_of_stock";
  price: string;
  brand?: string;
  mpn: string;
};

export function toMerchantProduct(product: StorefrontProduct, productUrl: string): MerchantProductRecord | null {
  const variant = product.variant;
  if (!variant) return null;

  return {
    id: variant.sku,
    title: product.name,
    description: product.description,
    link: productUrl,
    imageLink: product.image?.url,
    availability: variant.available > 0 ? "in_stock" : "out_of_stock",
    price: `${variant.price.toFixed(2)} ${variant.currency}`,
    brand: product.brand ?? undefined,
    mpn: variant.sku,
  };
}
