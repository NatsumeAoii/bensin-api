import { readFile, writeFile } from "node:fs/promises";

const indexPath = "v1/index.json";
const index = JSON.parse(await readFile(indexPath, "utf8"));
for (const [slug, entry] of Object.entries(index.provinsi)) {
  const contents = await readFile(`v1/provinsi/${slug}.json`, "utf8");
  entry.file_size_bytes = Buffer.byteLength(contents.replaceAll("\r\n", "\n"));
}
await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`);
console.log(`Updated ${Object.keys(index.provinsi).length} province file sizes`);
