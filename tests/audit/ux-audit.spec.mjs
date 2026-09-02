// Advanced usage / UI / UX audit suite.
// Exercises the real shopping journey, responsive layout, keyboard and
// screen-reader affordances across every locale and viewport.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const IN_STOCK_SLUG = "aurora-kablosuz-kulaklik";
const LOW_STOCK_SLUG = "nimbus-laptop-stand";
const OUT_OF_STOCK_SLUG = "vertex-mekanik-klavye";
const TR_ONLY_SLUG = "solis-tr-only-urun";

const locales = ["tr", "en", "de"];

const addLabel = { tr: "Sepete ekle", en: "Add to cart", de: "In den Warenkorb" };

async function overflow(page) {
  return page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    offenders: Array.from(document.querySelectorAll("body *"))
      .filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${el.className || "(no-class)"}`),
  }));
}

test.describe("A. Site entry and routing", () => {
  test("A1 site root serves a usable page", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status(), "GET / should not be an error status").toBeLessThan(400);
  });

  test("A2 unknown route renders a localized, navigable 404", async ({ page }) => {
    await page.goto("/fr");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang, "404 document must declare a language (WCAG 3.1.1)").toBeTruthy();
    await expect(page.locator("header").first(), "404 should keep site navigation").toBeVisible();
  });

  test("A3 missing product translation is not a dead end", async ({ page }) => {
    await page.goto(`/tr/products/${TR_ONLY_SLUG}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const deHref = await page.locator('.locale-nav a[hreflang="de"]').getAttribute("href");
    const res = await page.request.get(deHref);
    expect(res.status(), `locale switcher points at ${deHref} which is not reachable`).toBeLessThan(400);
  });
});

test.describe("B. Shopping journey", () => {
  for (const locale of locales) {
    test(`B1 ${locale}: home -> catalog -> product -> cart`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await page.getByRole("link", { name: /keşfet|Explore|entdecken/i }).first().click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/products$`));
      await page.locator(".product-card h2 a").first().click();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.getByRole("button", { name: addLabel[locale] }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog, "cart drawer must open after add-to-cart").toBeVisible();
      await expect(dialog.getByRole("listitem")).toHaveCount(1);
    });
  }

  test("B2 cart survives a page reload", async ({ page }) => {
    await page.goto(`/tr/products/${IN_STOCK_SLUG}`);
    await page.getByRole("button", { name: addLabel.tr }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.reload();
    const badge = await page.locator(".cart-button").innerText();
    expect(badge, "cart contents must not be silently lost on reload").toContain("1");
  });

  test("B3 cart survives navigation to another page", async ({ page }) => {
    await page.goto(`/tr/products/${IN_STOCK_SLUG}`);
    await page.getByRole("button", { name: addLabel.tr }).click();
    await page.getByRole("button", { name: "Sepeti kapat" }).click();
    await page.getByRole("link", { name: "Ürünler", exact: true }).first().click();
    await expect(page).toHaveURL(/\/tr\/products$/);
    const badge = await page.locator(".cart-button").innerText();
    expect(badge, "cart emptied by in-site navigation").toContain("1");
  });

  test("B4 cart offers a way to check out", async ({ page }) => {
    await page.goto(`/tr/products/${IN_STOCK_SLUG}`);
    await page.getByRole("button", { name: addLabel.tr }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const checkout = dialog.getByRole("button", { name: /ödeme|checkout|sipariş|kasa/i })
      .or(dialog.getByRole("link", { name: /ödeme|checkout|sipariş|kasa/i }));
    await expect(checkout, "cart drawer has no path to checkout").toHaveCount(1);
  });

  test("B5 clearing the quantity field does not delete the line", async ({ page }) => {
    await page.goto(`/tr/products/${IN_STOCK_SLUG}`);
    await page.getByRole("button", { name: addLabel.tr }).click();
    const qty = page.getByRole("dialog").getByRole("spinbutton");
    await qty.fill("");
    await expect(
      page.getByRole("dialog").getByRole("listitem"),
      "clearing the quantity input silently removed the cart line",
    ).toHaveCount(1);
  });

  test("B6 quantity cannot exceed available stock", async ({ page }) => {
    await page.goto(`/tr/products/${LOW_STOCK_SLUG}`); // 2 available
    await page.getByRole("button", { name: addLabel.tr }).click();
    const qty = page.getByRole("dialog").getByRole("spinbutton");
    await qty.fill("999");
    await qty.blur();
    const value = await qty.inputValue();
    expect(Number(value), "cart accepted a quantity larger than on-hand stock").toBeLessThanOrEqual(2);
  });

  test("B7 out-of-stock product cannot be added", async ({ page }) => {
    await page.goto(`/tr/products/${OUT_OF_STOCK_SLUG}`);
    const button = page.locator(".purchase-panel button");
    await expect(button).toBeDisabled();
  });

  test("B8 removing the last line keeps the drawer usable", async ({ page }) => {
    await page.goto(`/tr/products/${IN_STOCK_SLUG}`);
    await page.getByRole("button", { name: addLabel.tr }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Kaldır" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Sepetiniz boş.")).toBeVisible();
  });
});

test.describe("C. Accessibility", () => {
  const routes = {
    home: "/tr",
    catalog: "/tr/products",
    product: `/tr/products/${IN_STOCK_SLUG}`,
  };

  for (const [name, url] of Object.entries(routes)) {
    test(`C1 ${name} passes axe WCAG 2.1 A/AA`, async ({ page }) => {
      await page.goto(url);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s) — ${v.help}`),
      ).toEqual([]);
    });
  }

  test("C2 open cart drawer passes axe", async ({ page }) => {
    await page.goto(`/tr/products/${IN_STOCK_SLUG}`);
    await page.getByRole("button", { name: addLabel.tr }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  test("C3 product without an image still exposes a named media link", async ({ page }) => {
    await page.goto("/tr/products");
    const results = await new AxeBuilder({ page }).withRules(["link-name"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(" | ")}`)).toEqual([]);
  });

  test("C4 landmark navigations are distinguishable", async ({ page }) => {
    await page.goto("/tr");
    const labels = await page.locator("nav").evaluateAll((nodes) =>
      nodes.map((n) => n.getAttribute("aria-label") ?? n.getAttribute("aria-labelledby") ?? "(unlabelled)"),
    );
    expect(new Set(labels).size, `duplicate/ambiguous nav labels: ${JSON.stringify(labels)}`).toBe(labels.length);
  });

  test("C5 cart button announces its count meaningfully", async ({ page }) => {
    await page.goto(`/tr/products/${IN_STOCK_SLUG}`);
    const name = await page.locator(".cart-button").evaluate((el) => el.textContent?.replace(/\s+/g, " ").trim());
    expect(name, "cart button repeats a bare number with no unit for screen readers").not.toMatch(/\(\d+\)\s*\d+$/);
  });

  test("C6 skip link reaches main on every route", async ({ page }) => {
    for (const url of ["/tr", "/tr/products", `/tr/products/${IN_STOCK_SLUG}`]) {
      await page.goto(url);
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: "İçeriğe geç" })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("#main-content")).toBeFocused();
    }
  });

  test("C7 skip target is not hidden under the sticky header", async ({ page }) => {
    await page.goto("/tr/products");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(600);
    const geo = await page.evaluate(() => {
      const header = document.querySelector(".site-header");
      const heading = document.querySelector("#catalog-title");
      return {
        headerBottom: header ? header.getBoundingClientRect().bottom : 0,
        headingTop: heading ? heading.getBoundingClientRect().top : 0,
      };
    });
    expect(geo.headingTop, "page heading is covered by the sticky header after skip").toBeGreaterThanOrEqual(
      geo.headerBottom - 1,
    );
  });

  test("C8 drawer focus is trapped and restored", async ({ page }) => {
    await page.goto(`/tr/products/${IN_STOCK_SLUG}`);
    const trigger = page.getByRole("button", { name: addLabel.tr });
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    for (let i = 0; i < 12; i += 1) await page.keyboard.press("Tab");
    const inside = await page.evaluate(() => Boolean(document.querySelector(".cart-drawer")?.contains(document.activeElement)));
    expect(inside, "focus escaped the modal cart drawer").toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(trigger, "focus was not returned to the trigger").toBeFocused();
  });

  test("C9 background is inert while the drawer is open", async ({ page }) => {
    await page.goto(`/tr/products/${IN_STOCK_SLUG}`);
    await page.getByRole("button", { name: addLabel.tr }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const backgroundReachable = await page.evaluate(() => {
      const header = document.querySelector(".site-header");
      if (!header) return false;
      return !header.closest("[inert]") && !header.hasAttribute("aria-hidden");
    });
    expect(backgroundReachable, "page behind the modal is still exposed to assistive tech").toBe(false);
  });
});

test.describe("D. Responsive layout", () => {
  const widths = [320, 360, 414, 768, 1024, 1440];
  for (const width of widths) {
    test(`D1 no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const url of ["/tr", "/tr/products", `/tr/products/${IN_STOCK_SLUG}`]) {
        await page.goto(url);
        const result = await overflow(page);
        expect(
          result.scrollWidth,
          `${url} overflows at ${width}px; offenders: ${result.offenders.join(", ")}`,
        ).toBeLessThanOrEqual(result.clientWidth + 1);
      }
    });
  }

  test("D2 interactive targets meet the 24x24 minimum (WCAG 2.5.8)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/tr/products/${IN_STOCK_SLUG}`);
    await page.getByRole("button", { name: addLabel.tr }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const small = await page.evaluate(() =>
      Array.from(document.querySelectorAll("button, a[href], input, select"))
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { tag: el.tagName.toLowerCase(), cls: el.className, w: Math.round(r.width), h: Math.round(r.height) };
        })
        .filter((el) => el.w > 0 && el.h > 0 && (el.w < 24 || el.h < 24)),
    );
    expect(small, `targets under 24x24 CSS px: ${JSON.stringify(small)}`).toEqual([]);
  });

  test("D3 header stays usable on a narrow phone", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/tr");
    const headerHeight = await page.locator(".site-header").evaluate((el) => el.getBoundingClientRect().height);
    expect(headerHeight, "sticky header eats too much of a small viewport").toBeLessThan(720 * 0.25);
  });

  test("D4 200% zoom keeps content reflowed (WCAG 1.4.10)", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 512 });
    await page.goto("/tr/products");
    const result = await overflow(page);
    expect(
      result.scrollWidth,
      `reflow failure; offenders: ${result.offenders.join(", ")}`,
    ).toBeLessThanOrEqual(result.clientWidth + 1);
  });
});

test.describe("E. Content and localization", () => {
  test("E1 prices use the locale's own currency and format", async ({ page }) => {
    const seen = {};
    for (const locale of locales) {
      await page.goto(`/${locale}/products/${IN_STOCK_SLUG}`);
      seen[locale] = (await page.locator(".purchase-panel__price").innerText()).trim();
    }
    expect(seen.tr).toMatch(/₺|TRY/);
    expect(seen.en).toMatch(/\$|USD/);
    expect(seen.de).toMatch(/€|EUR/);
  });

  test("E2 catalog exposes the number of results", async ({ page }) => {
    await page.goto("/tr/products");
    const cards = await page.locator(".product-card").count();
    expect(cards).toBeGreaterThan(0);
    const body = await page.locator("#main-content").innerText();
    expect(body, "catalog never states how many products are listed").toMatch(new RegExp(`\\b${cards}\\b`));
  });

  test("E3 catalog offers sorting or filtering", async ({ page }) => {
    await page.goto("/tr/products");
    const controls = await page.locator("#main-content select, #main-content input[type=search], #main-content [role=tablist]").count();
    expect(controls, "catalog has no sort/filter/search affordance").toBeGreaterThan(0);
  });

  test("E4 product page keeps a breadcrumb trail", async ({ page }) => {
    await page.goto(`/tr/products/${IN_STOCK_SLUG}`);
    const crumbs = await page.locator('nav[aria-label*="readcrumb" i], nav[aria-label*="zinciri" i], ol.breadcrumb').count();
    expect(crumbs, "no breadcrumb navigation on the product detail page").toBeGreaterThan(0);
  });

  test("E5 stock messaging is specific on the catalog card", async ({ page }) => {
    await page.goto("/tr/products");
    const lowStockCard = page.locator(".product-card", { hasText: "Nimbus" });
    await expect(lowStockCard).toBeVisible();
    const text = await lowStockCard.innerText();
    expect(text, "low stock (2 left) is shown identically to abundant stock").toMatch(/2/);
  });
});
