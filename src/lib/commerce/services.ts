import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { buildOrderRequestFingerprint, normalizeIdempotencyKey } from "./order-idempotency";
import { cartSubtotalMinor, normalizeCurrency } from "./pricing";

const POSITIVE_INTEGER = /^[1-9]\d*$/;
const DECIMAL_MONEY = /^(\d+)(?:\.(\d{1,2}))?$/;

function decimalStringToMinor(value: string): number {
  const match = DECIMAL_MONEY.exec(value);
  if (!match) throw new RangeError(`Unsupported monetary value: ${value}`);
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  const minor = whole * 100 + fraction;
  if (!Number.isSafeInteger(minor)) throw new RangeError("Monetary value exceeds the safe integer range.");
  return minor;
}

function minorToDecimalString(value: number): string {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError("Invalid minor-unit monetary value.");
  const whole = Math.floor(value / 100);
  const fraction = String(value % 100).padStart(2, "0");
  return `${whole}.${fraction}`;
}

function orderNumberFromKey(key: string): string {
  const digest = createHash("sha256").update(key).digest("hex").slice(0, 20).toUpperCase();
  return `ORD-${digest}`;
}

function assertQuantity(quantity: number, allowZero = false): void {
  if (!Number.isSafeInteger(quantity) || quantity < (allowZero ? 0 : 1)) {
    throw new RangeError(allowZero ? "Quantity must be a non-negative safe integer." : "Quantity must be a positive safe integer.");
  }
}

export async function setCartItemQuantity(input: {
  cartId: string;
  variantId: string;
  quantity: number;
}): Promise<void> {
  assertQuantity(input.quantity, true);

  await db.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({ where: { id: input.cartId } });
    if (!cart) throw new Error("Cart not found.");

    if (input.quantity === 0) {
      await tx.cartItem.deleteMany({ where: { cartId: cart.id, variantId: input.variantId } });
      return;
    }

    const variant = await tx.productVariant.findUnique({
      where: { id: input.variantId },
      include: { product: true, inventory: true, prices: true },
    });
    if (!variant || !variant.active || variant.product.status !== "ACTIVE") {
      throw new Error("Purchasable variant not found.");
    }

    const available = (variant.inventory?.quantity ?? 0) - (variant.inventory?.reserved ?? 0);
    if (available < input.quantity) throw new Error("Insufficient inventory.");

    const now = new Date();
    const price = variant.prices
      .filter((candidate) => candidate.currency.toUpperCase() === cart.currency.toUpperCase())
      .filter((candidate) => !candidate.validFrom || candidate.validFrom <= now)
      .filter((candidate) => !candidate.validTo || candidate.validTo >= now)
      .sort((a, b) => (b.validFrom?.getTime() ?? 0) - (a.validFrom?.getTime() ?? 0))[0];
    if (!price) throw new Error("No active price for cart currency.");

    await tx.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
      update: { quantity: input.quantity, unitPrice: price.amount },
      create: {
        cartId: cart.id,
        productId: variant.productId,
        variantId: variant.id,
        quantity: input.quantity,
        unitPrice: price.amount,
      },
    });
  });
}

export async function createOrderFromCart(input: {
  cartId: string;
  idempotencyKey: string;
  email: string;
  locale: "TR" | "EN" | "DE";
  shippingData: Prisma.InputJsonObject;
  billingData: Prisma.InputJsonObject;
  customerId?: string | null;
}) {
  const key = normalizeIdempotencyKey(input.idempotencyKey);
  const orderNumber = orderNumberFromKey(key);

  return db.$transaction(async (tx) => {
    const existing = await tx.order.findUnique({ where: { orderNumber }, include: { items: true } });
    if (existing) return existing;

    const cart = await tx.cart.findUnique({
      where: { id: input.cartId },
      include: {
        items: {
          include: {
            product: { include: { translations: { where: { locale: input.locale }, take: 1 } } },
            variant: true,
          },
        },
      },
    });
    if (!cart || cart.items.length === 0) throw new Error("Cart is empty or missing.");
    if (input.customerId && cart.customerId && input.customerId !== cart.customerId) {
      throw new Error("Cart customer mismatch.");
    }

    const currency = normalizeCurrency(cart.currency);
    const lineInputs = cart.items.map((item) => ({
      unitPriceMinor: decimalStringToMinor(item.unitPrice.toString()),
      quantity: item.quantity,
    }));
    const subtotalMinor = cartSubtotalMinor(lineInputs);
    const fingerprint = buildOrderRequestFingerprint({
      customerId: input.customerId ?? cart.customerId,
      cartId: cart.id,
      currency,
      subtotalMinor,
    });

    for (const item of cart.items) {
      assertQuantity(item.quantity);
      const updated = await tx.$executeRaw`
        UPDATE "Inventory"
        SET "reserved" = "reserved" + ${item.quantity}, "updatedAt" = NOW()
        WHERE "variantId" = ${item.variantId}
          AND ("quantity" - "reserved") >= ${item.quantity}
      `;
      if (updated !== 1) throw new Error(`Insufficient inventory for variant ${item.variantId}.`);
    }

    const zero = "0.00";
    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: input.customerId ?? cart.customerId,
        currency,
        subtotal: minorToDecimalString(subtotalMinor),
        taxTotal: zero,
        shippingTotal: zero,
        discountTotal: zero,
        grandTotal: minorToDecimalString(subtotalMinor),
        email: input.email.trim().toLowerCase(),
        shippingData: input.shippingData,
        billingData: { ...input.billingData, _commerceFingerprint: fingerprint },
        items: {
          create: cart.items.map((item, index) => ({
            productId: item.productId,
            variantId: item.variantId,
            sku: item.variant.sku,
            name: item.product.translations[0]?.name ?? item.product.sku,
            quantity: item.quantity,
            unitPrice: minorToDecimalString(lineInputs[index].unitPriceMinor),
            lineTotal: minorToDecimalString(lineInputs[index].unitPriceMinor * item.quantity),
          })),
        },
      },
      include: { items: true },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    return order;
  }, { isolationLevel: "Serializable" });
}

export function parsePositiveQuantity(value: string): number {
  if (!POSITIVE_INTEGER.test(value)) throw new RangeError("Quantity must contain only positive integer digits.");
  const quantity = Number(value);
  assertQuantity(quantity);
  return quantity;
}
