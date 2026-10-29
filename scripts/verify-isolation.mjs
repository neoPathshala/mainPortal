import { readdir, readFile, realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, relative, isAbsolute } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
let traces = 0;
const outside = new Set();
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, item.name);
    if (item.isDirectory()) await walk(path);
    else if (item.name.endsWith(".nft.json")) {
      traces++;
      const record = JSON.parse(await readFile(path, "utf8"));
      for (const name of record.files || []) {
        let target = resolve(dirname(path), name);
        try {
          target = await realpath(target);
        } catch {}
        const local = relative(root, target);
        if (local === ".." || local.startsWith("../") || isAbsolute(local))
          outside.add(local);
      }
    }
  }
}
await walk(
  resolve(
    root,
    process.env.NEOPATHSHALA_BUILD_DIR || process.env.NEXT_DIST_DIR || ".next",
  ),
);
if (!traces)
  throw new Error("Build the portal before verifying deployment isolation.");
if (outside.size)
  throw new Error(
    `Deployment trace includes files outside this portal: ${[...outside].slice(0, 10).join(", ")}`,
  );
console.log(
  `Verified ${traces} production traces: all files resolve inside this portal.`,
);
