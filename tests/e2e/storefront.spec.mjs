import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const localeExpectations = {
  tr: { lang: "tr", heading: /Hızlı, güvenilir/i, skip: "İçeriğe geç" },
  en: { lang: "en", heading: /Fast, trustworthy/i, skip: "Skip to content" },
  de: { lang: "de", heading: /Schnelles, vertrauenswürdiges/i, skip: "Zum Inhalt" },
};

for (const [locale, expected] of Object.entries(localeExpectations)) {
  test.describe(`${locale} storefront certification`, () => {
    test(`renders the localized home experience without horizontal overflow`, async ({ page }, testInfo) => {
      await page.goto(`/${locale}`);
      await expect(page.locator("html")).toHaveAttribute("lang", expected.lang);
      await expect(page.getByRole("heading", { level: 1, name: expected.heading })).toBeVisible();
      await expect(page.locator("#main-content")).toBeVisible();

      const layout = await page.evaluate(() => ({
        viewportWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        main: document.querySelector("#main-content")?.getBoundingClientRect().toJSON(),
        header: document.querySelector("header")?.getBoundingClientRect().toJSON(),
        hero: document.querySelector(".hero")?.getBoundingClientRect().toJSON(),
      }));

      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
      expect(layout.main?.width ?? 0).toBeGreaterThan(0);
      expect(layout.hero?.width ?? 0).toBeGreaterThan(0);

      await testInfo.attach(`${locale}-${testInfo.project.name}-visual-contract.json`, {
        body: Buffer.from(JSON.stringify(layout, null, 2)),
        contentType: "application/json",
      });
      await testInfo.attach(`${locale}-${testInfo.project.name}.png`, {
        body: await page.screenshot({ fullPage: true, animations: "disabled" }),
        contentType: "image/png",
      });
    });

    test(`passes automated accessibility scan`, async ({ page }) => {
      await page.goto(`/${locale}`);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(results.violations).toEqual([]);
    });

    test(`supports keyboard skip navigation`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await page.keyboard.press("Tab");
      const skipLink = page.getByRole("link", { name: expected.skip });
      await expect(skipLink).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("#main-content")).toBeFocused();
    });
  });
}

test("locale navigation preserves the current route family", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator('a[href="/de"]')).toBeVisible();
  await page.locator('a[href="/de"]').first().click();
  await expect(page).toHaveURL(/\/de\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
});
