import { mkdir, copyFile, cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const target = new URL("../public/pdf/", import.meta.url);
await mkdir(target, { recursive: true });
await copyFile(
  fileURLToPath(
    new URL(
      "../node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ),
  ),
  fileURLToPath(new URL("pdf.worker.min.mjs", target)),
);
for (const directory of ["cmaps", "standard_fonts", "wasm"]) {
  await cp(
    new URL(`../node_modules/pdfjs-dist/${directory}/`, import.meta.url),
    new URL(`${directory}/`, target),
    { recursive: true },
  );
}
