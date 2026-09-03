import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setCartItemQuantity } from "@/lib/commerce/services";
import { orchestrateCheckout } from "@/lib/checkout/orchestrator";
import { localPaymentGateway } from "@/lib/checkout/local-payment-gateway";

export const runtime = "nodejs";

const localeCurrency = { tr: "TRY", en: "USD", de: "EUR" } as const;
const localeDb = { tr: "TR", en: "EN", de: "DE" } as const;

type CheckoutBody = {
  locale?: string;
  email?: string;
  fullName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  idempotencyKey?: string;
  lines?: Array<{ variantId?: string; quantity?: number }>;
};

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function rateIdentity(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return (forwarded || realIp || "local-checkout").replace(/[^A-Za-z0-9._:@-]/g, "_").slice(0, 160);
}

export async function POST(request: Request) {
  let body: CheckoutBody;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON payload.");
  }

  if (body.locale !== "tr" && body.locale !== "en" && body.locale !== "de") {
    return badRequest("Unsupported locale.");
  }
  if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email.trim())) return badRequest("Valid email is required.");
  if (!body.fullName?.trim() || !body.address?.trim() || !body.city?.trim()) return badRequest("Shipping details are required.");
  if (!body.idempotencyKey || !/^[A-Za-z0-9_-]{8,128}$/.test(body.idempotencyKey)) {
    return badRequest("Invalid idempotency key.");
  }
  if (!Array.isArray(body.lines) || body.lines.length === 0 || body.lines.length > 50) {
    return badRequest("Cart lines are required.");
  }

  const lines = body.lines.flatMap((line) => {
    if (!line.variantId || !/^[A-Za-z0-9_-]{1,128}$/.test(line.variantId)) return [];
    if (!Number.isSafeInteger(line.quantity) || Number(line.quantity) < 1) return [];
    return [{ variantId: line.variantId, quantity: Number(line.quantity) }];
  });
  if (lines.length !== body.lines.length) return badRequest("Invalid cart line.");

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "Payment provider is not configured for production." },
      { status: 503 },
    );
  }

  const cart = await db.cart.create({ data: { currency: localeCurrency[body.locale] } });

  try {
    for (const line of lines) {
      await setCartItemQuantity({ cartId: cart.id, variantId: line.variantId, quantity: line.quantity });
    }

    const result = await orchestrateCheckout(localPaymentGateway, {
      cartId: cart.id,
      idempotencyKey: body.idempotencyKey,
      email: body.email.trim(),
      locale: localeDb[body.locale],
      shippingData: {
        fullName: body.fullName.trim(),
        address: body.address.trim(),
        city: body.city.trim(),
        postalCode: body.postalCode?.trim() ?? "",
      },
      billingData: {
        fullName: body.fullName.trim(),
        address: body.address.trim(),
        city: body.city.trim(),
        postalCode: body.postalCode?.trim() ?? "",
      },
      rateLimitIdentity: rateIdentity(request),
      returnUrl: `https://local-checkout.invalid/${body.locale}/checkout/complete`,
      paymentProvider: "local-development",
    });

    return NextResponse.json({
      ok: true,
      orderNumber: result.order.orderNumber,
      orderStatus: result.order.status,
      paymentStatus: result.payment.status,
    });
  } catch (error) {
    await db.cartItem.deleteMany({ where: { cartId: cart.id } }).catch(() => undefined);
    await db.cart.delete({ where: { id: cart.id } }).catch(() => undefined);
    const message = error instanceof Error ? error.message : "Checkout failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 409 });
  }
}
