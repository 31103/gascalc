import { rename } from "node:fs/promises";
import { resolve } from "node:path";

const distDirectory = resolve("dist");

await rename(
  resolve(distDirectory, "index.html"),
  resolve(distDirectory, "gascalc.html"),
);
