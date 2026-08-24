import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const title = locale === "tr" ? "Ürünler" : locale === "de" ? "Produkte" : "Products";

  return (
    <main id="main-content" className="container" style={{ paddingBlock: "4rem" }}>
      <h1>{title}</h1>
      <p>Commerce catalog foundation is ready for the product data phase.</p>
    </main>
  );
}
