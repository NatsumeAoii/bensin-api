import { readdir, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const MAX_JS_GZIP_KB = 200;
const MAX_CSS_GZIP_KB = 75;
const DIST_ASSETS_DIR = join(import.meta.dirname, "..", "dist", "assets");

async function gzipKb(filePath) {
  const content = await readFile(filePath);
  return gzipSync(content).length / 1024;
}

async function checkBundleSize() {
  let files;
  try {
    files = await readdir(DIST_ASSETS_DIR);
  } catch {
    console.error("❌ dist/assets directory not found. Did the build succeed?");
    process.exit(1);
  }

  const jsFiles = files.filter((file) => file.endsWith(".js"));
  const cssFiles = files.filter((file) => file.endsWith(".css"));

  if (jsFiles.length === 0) {
    console.error("❌ No JS files found in dist/assets/");
    process.exit(1);
  }

  let hasFailure = false;
  let totalKb = 0;

  for (const file of jsFiles) {
    const sizeKB = await gzipKb(join(DIST_ASSETS_DIR, file));
    totalKb += sizeKB;
    const ok = sizeKB <= MAX_JS_GZIP_KB;
    if (!ok) hasFailure = true;
    console.log(
      `${ok ? "✅ OK" : "❌ FAIL"}  ${file}: ${sizeKB.toFixed(2)} KB gzipped (limit: ${MAX_JS_GZIP_KB} KB)`
    );
  }

  for (const file of cssFiles) {
    const sizeKB = await gzipKb(join(DIST_ASSETS_DIR, file));
    totalKb += sizeKB;
    const ok = sizeKB <= MAX_CSS_GZIP_KB;
    if (!ok) hasFailure = true;
    console.log(
      `${ok ? "✅ OK" : "❌ FAIL"}  ${file}: ${sizeKB.toFixed(2)} KB gzipped (limit: ${MAX_CSS_GZIP_KB} KB)`
    );
  }

  console.log(`\nTotal asset payload: ${totalKb.toFixed(2)} KB gzipped`);

  if (hasFailure) {
    console.error(
      `\n❌ Bundle size check failed. JS chunks must be < ${MAX_JS_GZIP_KB} KB and CSS < ${MAX_CSS_GZIP_KB} KB gzipped.`
    );
    process.exit(1);
  }

  console.log("\n✅ All assets are within the size budget.");
}

checkBundleSize();
