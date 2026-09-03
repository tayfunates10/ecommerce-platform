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
  const result = run({ RELEASE_SHA: "a".repeat(40) }, ["http://shop.example.org"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must use HTTPS/);
});

test("production verifier rejects example domains as synthetic evidence", () => {
  const result = run({ RELEASE_SHA: "b".repeat(40) }, ["https://example.com"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /real public production hostname/);
});

test("production verifier rejects reserved test domains as synthetic evidence", () => {
  const result = run({ RELEASE_SHA: "c".repeat(40) }, ["https://shop.production.test"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /real public production hostname/);
});

test("production verifier rejects IP literals", () => {
  const result = run({ RELEASE_SHA: "d".repeat(40) }, ["https://203.0.113.10"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /real public production hostname/);
});

test("production verifier rejects credentials in the production origin", () => {
  const result = run({ RELEASE_SHA: "e".repeat(40) }, ["https://user:pass@shop.example.org"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must not contain credentials/);
});

test("production verifier rejects paths, queries and fragments", () => {
  const result = run({ RELEASE_SHA: "f".repeat(40) }, ["https://shop.example.org/tr?probe=1"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /origin only/);
});

test("production verifier requires an exact 40-character release SHA before network access", () => {
  const result = run({ PRODUCTION_URL: "https://shop.example.org", RELEASE_SHA: "deadbeef" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /exact 40-character Git commit SHA/);
});
