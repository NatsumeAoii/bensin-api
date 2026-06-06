import { readdir, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const MAX_GZIP_SIZE_KB = 200;
const DIST_ASSETS_DIR = join(import.meta.dirname, "..", "dist", "assets");

async function checkBundleSize() {
  let files;
  try {
    files = await readdir(DIST_ASSETS_DIR);
  } catch {
    console.error("❌ dist/assets directory not found. Did the build succeed?");
    process.exit(1);
  }

  const jsFiles = files.filter((file) => file.endsWith(".js"));

  if (jsFiles.length === 0) {
    console.error("❌ No JS files found in dist/assets/");
    process.exit(1);
  }

  let hasFailure = false;

  for (const file of jsFiles) {
    const filePath = join(DIST_ASSETS_DIR, file);
    const content = await readFile(filePath);
    const gzipped = gzipSync(content);
    const sizeKB = gzipped.length / 1024;

    const status = sizeKB > MAX_GZIP_SIZE_KB ? "❌ FAIL" : "✅ OK";
    console.log(
      `${status}  ${file}: ${sizeKB.toFixed(2)} KB gzipped (limit: ${MAX_GZIP_SIZE_KB} KB)`
    );

    if (sizeKB > MAX_GZIP_SIZE_KB) {
      hasFailure = true;
    }
  }

  if (hasFailure) {
    console.error(
      `\n❌ Bundle size check failed. Main JS chunk must be < ${MAX_GZIP_SIZE_KB} KB gzipped.`
    );
    process.exit(1);
  }

  console.log("\n✅ All JS chunks are within the size budget.");
}

checkBundleSize();
