import { rm } from "node:fs/promises";

try {
  await rm("dist/.temp", { recursive: true, force: true });
  console.log("Cleaned dist/.temp");
} catch (err) {
  console.error("Failed to clean dist/.temp:", err);
  process.exit(1);
}
