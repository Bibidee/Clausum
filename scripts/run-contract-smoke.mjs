import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const parent = join(root, "..", "..");
const candidates = [
  process.env.GENLAYER_PYTHON,
  join(parent, ".tools", "python312", "python.exe"),
  "python",
].filter((value) => value && (value === "python" || existsSync(value)));

let result;
const testHome = process.env.GLTEST_HOME || join(parent, ".tools", "gltest-user");
for (const python of candidates) {
  result = spawnSync(python, ["tests/direct_contract_smoke.py"], {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      USERPROFILE: testHome,
      HOME: testHome,
    },
  });
  if (!result.error || result.error.code !== "ENOENT") break;
}
if (!result || result.error) process.exit(1);
process.exit(result.status ?? 1);
