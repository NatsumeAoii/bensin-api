import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const root = process.argv[2] ?? "dist";
for (const file of ["index.html", "404.html", "v1/index.json", "v1/nasional.json"]) {
  await stat(join(root, file));
}

const index = JSON.parse(await readFile(join(root, "v1/index.json"), "utf8"));
if (index.provinsi_count !== Object.keys(index.provinsi).length) {
  throw new Error("Pages artifact index province count is inconsistent");
}
for (const entry of Object.values(index.provinsi)) {
  const path = entry.path.replace(/^\//, "");
  const file = join(root, path.replaceAll("/", sep));
  const contents = await readFile(file);
  if ((await stat(file)).size !== entry.file_size_bytes) {
    throw new Error(`Pages artifact file size mismatch: ${path}`);
  }
  JSON.parse(contents);
}

const files = [];
async function collect(directory) {
  for (const name of await readdir(directory)) {
    const file = join(directory, name);
    if (relative(root, file).replaceAll(sep, "/") === "artifact-manifest.sha256") {
      continue;
    }
    if ((await stat(file)).isDirectory()) await collect(file);
    else files.push(file);
  }
}
await collect(root);
files.sort();
const manifest = [];
for (const file of files) {
  const digest = createHash("sha256").update(await readFile(file)).digest("hex");
  manifest.push(`${digest}  ${relative(root, file).replaceAll(sep, "/")}`);
}
await writeFile(join(root, "artifact-manifest.sha256"), `${manifest.join("\n")}\n`);
console.log(`Validated ${files.length} Pages artifact files`);
