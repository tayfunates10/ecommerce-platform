import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const localeCurrency = { tr: "TRY", en: "USD", de: "EUR" } as const;
const localeDb = { tr: "TR", en: "EN", de: "DE" } as const;

type Locale = keyof typeof localeCurrency;
type StoredLine = { variantId?: unknown; quantity?: unknown };

function isLocale(value: unknown): value is Locale {
  return value === "tr" || value === "en" || value === "de";
}

export async function POST(request: Request) {
  let body: { locale?: unknown; lines?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ lines: [] }, { status: 400 });
  }

  if (!isLocale(body.locale) || !Array.isArray(body.lines) || body.lines.length > 50) {
    return NextResponse.json({ lines: [] }, { status: 400 });
  }

  const requested = (body.lines as StoredLine[]).flatMap((line) => {
    if (typeof line?.variantId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(line.variantId)) return [];
    const quantity = Number(line.quantity);
    if (!Number.isSafeInteger(quantity) || quantity < 1) return [];
    return [{ variantId: line.variantId, quantity }];
  });

  if (requested.length === 0) return NextResponse.json({ lines: [] });

  const variants = await db.productVariant.findMany({
    where: {
      id: { in: [...new Set(requested.map((line) => line.variantId))] },
      active: true,
      product: { status: "ACTIVE" },
    },
    include: {
      product: {
        include: {
          translations: { where: { locale: localeDb[body.locale] }, take: 1 },
        },
      },
      inventory: true,
      prices: { where: { currency: localeCurrency[body.locale] } },
    },
  });

  const byId = new Map(variants.map((variant) => [variant.id, variant]));
  const now = new Date();
  const lines = requested.flatMap((requestedLine) => {
    const variant = byId.get(requestedLine.variantId);
    if (!variant) return [];

    const available = Math.max(0, (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0));
    if (available < 1) return [];

    const price = variant.prices
      .filter((candidate) => !candidate.validFrom || candidate.validFrom <= now)
      .filter((candidate) => !candidate.validTo || candidate.validTo >= now)
      .sort((a, b) => (b.validFrom?.getTime() ?? 0) - (a.validFrom?.getTime() ?? 0))[0];
    if (!price) return [];

    return [{
      variantId: variant.id,
      slug: variant.product.slug,
      name: variant.product.translations[0]?.name ?? variant.product.sku,
      sku: variant.sku,
      quantity: Math.min(requestedLine.quantity, available),
      unitPrice: Number(price.amount.toString()),
      currency: localeCurrency[body.locale],
      available,
    }];
  });

  return NextResponse.json({ lines });
}
