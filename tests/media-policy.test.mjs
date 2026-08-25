import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/components/performance/deferred-video.tsx", import.meta.url), "utf8");

test("deferred video reserves a poster and never preloads media eagerly", () => {
  assert.match(source, /poster=\{poster\}/);
  assert.match(source, /preload="none"/);
  assert.match(source, /playsInline/);
});

test("video sources are withheld until the viewport observer authorizes loading", () => {
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /rootMargin:\s*"300px 0px"/);
  assert.match(source, /canLoad\s*\?\s*sources\.map/);
});
