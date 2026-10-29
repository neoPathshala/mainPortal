import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generated = [
  ".next",
  ".next-webpack",
  ".turbo",
  ".cache",
  "node_modules/.cache",
  "tsconfig.tsbuildinfo",
];
for (const entry of generated) {
  await rm(path.join(root, entry), {
    recursive: true,
    force: true,
    maxRetries: 3,
    retryDelay: 100,
  });
  console.log(`Cleared ${entry}`);
}
