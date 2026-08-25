import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const script = new URL("../scripts/verify-production.mjs", import.meta.url);

function run(env = {}, args = []) {
  return spawnSync(process.execPath, [script.pathname, ...args], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PRODUCTION_URL: "",
      RELEASE_SHA: "",
      RELEASE_EVIDENCE_OUTPUT: "",
      ...env,
    },
    encoding: "utf8",
  });
}

test("production verifier requires an explicit target", () => {
  const result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /PRODUCTION_URL is required/);
});

test("production verifier rejects non-HTTPS targets before network access", () => {
  const result = run(
    { RELEASE_SHA: "a".repeat(40) },
    ["http://shop.production.test"],
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must use HTTPS/);
});

test("production verifier rejects example.com as synthetic evidence", () => {
  const result = run(
    { RELEASE_SHA: "b".repeat(40) },
    ["https://example.com"],
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /real production hostname/);
});

test("production verifier requires an exact 40-character release SHA before network access", () => {
  const result = run(
    { PRODUCTION_URL: "https://shop.production.test", RELEASE_SHA: "deadbeef" },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /exact 40-character Git commit SHA/);
});
