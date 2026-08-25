import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";
import { gzipSync } from "node:zlib";
import { performanceBudget } from "../src/lib/performance.ts";

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

function scriptChunkPaths(html) {
  const paths = new Set();
  const pattern = /<script[^>]+src="\/_next\/static\/([^"]+\.js)"/g;
  for (const match of html.matchAll(pattern)) {
    if (match[1]) paths.add(match[1]);
  }
  return [...paths];
}

async function gzipBytesForPage(html) {
  let bytes = 0;
  for (const chunk of scriptChunkPaths(html)) {
    const file = resolve(staticRoot, chunk.split("/").join(sep));
    const metadata = await stat(file).catch(() => null);
    if (!metadata?.isFile()) throw new Error(`Referenced client chunk is missing: ${chunk}`);
    bytes += gzipSync(await readFile(file)).byteLength;
  }
  return bytes;
}

const htmlFiles = await walk(serverApp, (file) => file.endsWith(".html"));
if (htmlFiles.length === 0) {
  throw new Error("Performance budget check found no prerendered HTML artifacts.");
}

const failures = [];
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const domNodes = countDomNodes(html);
  const jsGzipKb = (await gzipBytesForPage(html)) / 1024;
  const routeArtifact = relative(serverApp, file);

  console.log(`${routeArtifact}: DOM=${domNodes}, initial JS gzip=${jsGzipKb.toFixed(1)}KB`);

  if (domNodes > performanceBudget.domNodes) {
    failures.push(`${routeArtifact} DOM ${domNodes} > ${performanceBudget.domNodes}`);
  }
  if (jsGzipKb > performanceBudget.initialJsGzipKb) {
    failures.push(`${routeArtifact} initial JS ${jsGzipKb.toFixed(1)}KB > ${performanceBudget.initialJsGzipKb}KB`);
  }
}

if (failures.length > 0) {
  throw new Error(`Performance budget exceeded:\n${failures.join("\n")}`);
}
