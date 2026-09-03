import { expect, test } from "@playwright/test";

const LOW_STOCK_SLUG = "nimbus-laptop-stand";
const TR_ONLY_SLUG = "solis-tr-only-urun";
const STORAGE_KEY = "ecommerce-platform:cart:v1";

async function addLowStockItem(page) {
  await page.goto(`/tr/products/${LOW_STOCK_SLUG}`);
  await page.getByRole("button", { name: "Sepete ekle" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test.describe("F. Round-2 checkout and persistence regressions", () => {
  test("F1 checkout shows line items, quantity and totals", async ({ page }) => {
    await addLowStockItem(page);
    await page.getByRole("dialog").getByRole("link", { name: "Ödemeye geç" }).click();
    await expect(page).toHaveURL(/\/tr\/checkout$/);
    const summary = page.locator(".checkout-summary");
    await expect(summary.getByRole("heading", { name: "Sipariş özeti" })).toBeVisible();
    await expect(summary).toContainText("Nimbus");
    await expect(summary).toContainText("Adet: 1");
    await expect(summary).toContainText(/₺|TRY/);
    await expect(summary).toContainText("Toplam");
  });

  test("F2 production checkout is unavailable before data entry and localized", async ({ page }) => {
    await addLowStockItem(page);
    await page.getByRole("dialog").getByRole("link", { name: "Ödemeye geç" }).click();
    await expect(page.getByRole("heading", { name: "Ödeme şu anda kullanılamıyor" })).toBeVisible();
    await expect(page.getByText(/Production ortamında gerçek ödeme sağlayıcısı yapılandırılmadan/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Siparişi oluştur" })).toHaveCount(0);
    await expect(page.getByLabel("E-posta")).toHaveCount(0);
  });

  test("F3 production checkout API returns a stable code without raw exception text", async ({ page }) => {
    const response = await page.request.post("/api/checkout", { data: {} });
    expect(response.status()).toBe(503);
    const payload = await response.json();
    expect(payload).toEqual({ ok: false, code: "CHECKOUT_UNAVAILABLE" });
    expect(payload.error).toBeUndefined();
  });

  test("F4 tampered persisted cart is revalidated from server truth", async ({ page }) => {
    await addLowStockItem(page);
    await page.getByRole("button", { name: "Sepeti kapat" }).click();

    await page.evaluate(({ key }) => {
      const current = JSON.parse(window.localStorage.getItem(key) ?? "[]");
      const variantId = current[0]?.variantId;
      window.localStorage.setItem(key, JSON.stringify([{
        variantId,
        quantity: 99999,
        unitPrice: 0.01,
        available: 99999,
        name: "HACKED CART NAME",
        sku: "FAKE-SKU",
        slug: "fake-slug",
        currency: "TRY",
      }]));
    }, { key: STORAGE_KEY });

    await page.reload();
    await expect(page.locator(".cart-button")).toContainText("(2)");
    await page.locator(".cart-button").click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Nimbus");
    await expect(dialog).not.toContainText("HACKED CART NAME");
    await expect(dialog.getByRole("spinbutton")).toHaveValue("2");
    await expect(dialog).not.toContainText("₺0,02");
  });

  test("F5 product locale fallback explains why the shopper was relocated", async ({ page }) => {
    await page.goto(`/tr/products/${TR_ONLY_SLUG}`);
    await page.locator('.locale-nav a[hreflang="en"]').click();
    await expect(page).toHaveURL(/\/en\/products\?notice=product-unavailable$/);
    await expect(page.getByRole("status")).toContainText(/not available in the selected language/i);
  });
});
