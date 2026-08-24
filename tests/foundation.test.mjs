import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const i18nSource = await readFile(new URL("../src/i18n/config.ts", import.meta.url), "utf8");

test("production framework versions are pinned", () => {
  assert.equal(packageJson.dependencies.next, "16.2.11");
  assert.equal(packageJson.dependencies.react, "19.2.0");
  assert.equal(packageJson.dependencies["react-dom"], "19.2.0");
});

test("all required storefront locales are declared", () => {
  for (const locale of ["tr", "en", "de"]) {
    assert.match(i18nSource, new RegExp(`\\"${locale}\\"`));
  }
});

test("Turkish is the default locale", () => {
  assert.match(i18nSource, /defaultLocale: Locale = \"tr\"/);
});
