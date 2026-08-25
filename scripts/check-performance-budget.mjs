import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";
import { gzipSync } from "node:zlib";
import { performanceBudget } from "../src/lib/performance.ts";
import { STOREFRONT_PRODUCT_LIMIT } from "../src/lib/storefront-data.ts";

const root = process.cwd();
const serverApp = resolve(root, ".next/server/app");
const staticRoot = resolve(root, ".next/static");

async function walk(directory, predicate) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path, predicate));
    else if (predicate(path)) files.push(path);
  }
  return files;
}

function countDomNodes(html) {
  return html.match(/<(?!\/|!|\?)([a-zA-Z][\w:-]*)\b/g)?.length ?? 0;
}

function initialScriptChunkPaths(html) {
  const paths = new Set();
  for (const match of html.matchAll(/<script[^>]+src="\/_next\/static\/([^"]+\.js)"/g)) {
    if (match[1]) paths.add(match[1]);
  }
  return [...paths];
}

function referencedChunkPaths(text) {
  const paths = new Set(initialScriptChunkPaths(text));
  for (const match of text.matchAll(/static\/([^"']+\.js)/g)) {
    if (match[1]) paths.add(match[1]);
  }
  return [...paths];
}

async function gzipBreakdownForChunks(chunks) {
  const breakdown = [];
  let bytes = 0;
  for (const chunk of chunks) {
    const file = resolve(staticRoot, chunk.split("/").join(sep));
    const metadata = await stat(file).catch(() => null);
    if (!metadata?.isFile()) throw new Error(`Referenced client chunk is missing: ${chunk}`);
    const gzipBytes = gzipSync(await readFile(file)).byteLength;
    bytes += gzipBytes;
    breakdown.push({ chunk, gzipBytes });
  }
  breakdown.sort((a, b) => b.gzipBytes - a.gzipBytes);
  return { bytes, breakdown };
}

function logChunkBreakdown(label, breakdown) {
  for (const { chunk, gzipBytes } of breakdown) {
    console.log(`  ${label} chunk ${chunk}: ${(gzipBytes / 1024).toFixed(1)}KB gzip`);
  }
}

const failures = [];
const htmlFiles = await walk(serverApp, (file) => file.endsWith(".html"));
if (htmlFiles.length === 0) {
  throw new Error("Performance budget check found no prerendered HTML artifacts.");
}

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const domNodes = countDomNodes(html);
  const routeArtifact = relative(serverApp, file);
  const initialChunks = initialScriptChunkPaths(html);
  const { bytes: jsGzipBytes, breakdown } = await gzipBreakdownForChunks(initialChunks);
  const jsGzipKb = jsGzipBytes / 1024;

  console.log(`${routeArtifact}: DOM=${domNodes}, initial JS gzip=${jsGzipKb.toFixed(1)}KB`);
  if (jsGzipKb > performanceBudget.initialJsGzipKb) {
    logChunkBreakdown(routeArtifact, breakdown);
  }
  if (domNodes > performanceBudget.domNodes) failures.push(`${routeArtifact} DOM ${domNodes} > ${performanceBudget.domNodes}`);
  if (jsGzipKb > performanceBudget.initialJsGzipKb) failures.push(`${routeArtifact} initial JS ${jsGzipKb.toFixed(1)}KB > ${performanceBudget.initialJsGzipKb}KB`);
}

const dynamicRoutes = [
  {
    name: "[locale]/products",
    manifest: resolve(serverApp, "[locale]/products/page_client-reference-manifest.js"),
    maxDomNodes: 60 + STOREFRONT_PRODUCT_LIMIT * 15,
  },
  {
    name: "[locale]/products/[slug]",
    manifest: resolve(serverApp, "[locale]/products/[slug]/page_client-reference-manifest.js"),
    maxDomNodes: 180,
  },
];

for (const route of dynamicRoutes) {
  const metadata = await stat(route.manifest).catch(() => null);
  if (!metadata?.isFile()) {
    failures.push(`${route.name} dynamic client-reference manifest missing; route budget was not evaluated`);
    continue;
  }

  const manifestText = await readFile(route.manifest, "utf8");
  const routeChunks = referencedChunkPaths(manifestText);
  const { bytes: jsGzipBytes, breakdown } = await gzipBreakdownForChunks(routeChunks);
  const jsGzipKb = jsGzipBytes / 1024;
  console.log(`${route.name}: DOM envelope=${route.maxDomNodes}, route client JS gzip=${jsGzipKb.toFixed(1)}KB`);
  if (jsGzipKb > performanceBudget.initialJsGzipKb) {
    logChunkBreakdown(route.name, breakdown);
  }

  if (route.maxDomNodes > performanceBudget.domNodes) failures.push(`${route.name} DOM envelope ${route.maxDomNodes} > ${performanceBudget.domNodes}`);
  if (jsGzipKb > performanceBudget.initialJsGzipKb) failures.push(`${route.name} client JS ${jsGzipKb.toFixed(1)}KB > ${performanceBudget.initialJsGzipKb}KB`);
}

if (failures.length > 0) {
  throw new Error(`Performance budget exceeded:\n${failures.join("\n")}`);
}
