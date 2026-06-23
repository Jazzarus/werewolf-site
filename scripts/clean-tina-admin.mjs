import fs from "node:fs";
import path from "node:path";

fs.rmSync(path.join(process.cwd(), "public", "admin"), {
  recursive: true,
  force: true,
});
