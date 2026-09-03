import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "../globals.css";
import "../storefront.css";
import "../remediation.css";
import { WebVitalsReporter } from "@/components/performance/web-vitals-reporter";
import { CartDrawer } from "@/components/storefront/cart-ui";
import { CartProvider } from "@/components/storefront/cart-provider";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { isLocale, locales } from "@/i18n/config";
import { normalizeWebVitalsEndpoint } from "@/lib/performance";
import { absoluteUrl, localeAlternates, localizedPath, siteName, siteUrl } from "@/lib/seo";

const descriptions = {
  tr: "Hızlı, güvenli ve çok dilli yeni nesil e-ticaret deneyimi.",
  en: "A fast, secure, multilingual next-generation commerce experience.",
  de: "Ein schnelles, sicheres und mehrsprachiges E-Commerce-Erlebnis.",
} as const;

const webVitalsEndpoint = normalizeWebVitalsEndpoint(process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT);

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
    metadataBase: new URL(siteUrl),
    title: { default: siteName, template: `%s | ${siteName}` },
    description: descriptions[locale],
    alternates: {
      canonical: absoluteUrl(localizedPath(locale)),
      languages: localeAlternates(),
    },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName,
      locale,
      url: absoluteUrl(localizedPath(locale)),
      title: siteName,
      description: descriptions[locale],
    },
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
        <CartProvider locale={locale}>
          <div data-storefront-shell>
            <a className="skip-link" href="#main-content">
              {locale === "tr" ? "İçeriğe geç" : locale === "de" ? "Zum Inhalt" : "Skip to content"}
            </a>
            <SiteHeader locale={locale} />
            {children}
            <SiteFooter locale={locale} />
          </div>
          <CartDrawer locale={locale} />
        </CartProvider>
        {webVitalsEndpoint ? <WebVitalsReporter endpoint={webVitalsEndpoint} /> : null}
      </body>
    </html>
  );
}
