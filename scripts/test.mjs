import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("../", import.meta.url));
const tests = resolve(root, "tests");
const files = (await readdir(tests))
  .filter((file) => /\.test\.(?:mjs|cjs)$/.test(file))
  .sort();
const selected = [];
for (const file of files) {
  const source = await readFile(resolve(tests, file), "utf8");
  const peers = [
    ...new Set(
      [
        ...source.matchAll(
          /(?:\.\.\/)+(adminPortal|mainPanel|entrancePortal)\//g,
        ),
      ].map((match) => match[1]),
    ),
  ];
  const missing = peers.filter(
    (peer) => !existsSync(resolve(root, "..", peer, "package.json")),
  );
  if (missing.length) {
    console.log(
      `SKIP repository contract ${file}: sibling checkout ${missing.join(", ")} is absent.`,
    );
    continue;
  }
  selected.push(resolve(tests, file));
}
if (!selected.length) throw new Error("No local tests found.");
const result = spawnSync(process.execPath, ["--test", ...selected], {
  cwd: root,
  stdio: "inherit",
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
