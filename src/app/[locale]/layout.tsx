import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "../globals.css";
import { isLocale, locales } from "@/i18n/config";

const descriptions = {
  tr: "Hızlı, güvenli ve çok dilli yeni nesil e-ticaret deneyimi.",
  en: "A fast, secure, multilingual next-generation commerce experience.",
  de: "Ein schnelles, sicheres und mehrsprachiges E-Commerce-Erlebnis.",
} as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  return {
    title: {
      default: "Ecommerce Platform",
      template: "%s | Ecommerce Platform",
    },
    description: descriptions[locale],
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale}>
      <body>
        <a className="skip-link" href="#main-content">
          {locale === "tr" ? "İçeriğe geç" : locale === "de" ? "Zum Inhalt" : "Skip to content"}
        </a>
        {children}
      </body>
    </html>
  );
}
