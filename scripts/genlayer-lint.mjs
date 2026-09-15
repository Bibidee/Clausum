import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const bundledPath = join(root, ".genlayer-python");
const env = {
  ...process.env,
  PYTHONPATH: [bundledPath, process.env.PYTHONPATH].filter(Boolean).join(process.platform === "win32" ? ";" : ":"),
  PATH: [join(bundledPath, "bin"), process.env.PATH].filter(Boolean).join(process.platform === "win32" ? ";" : ":"),
  GENVM_REPO: "genlayerlabs/genvm-manager",
  GENVM_VERSION: process.env.GENVM_VERSION || "v0.6.0-rc5",
  PYTHONIOENCODING: "utf-8",
};

const candidates = [
  process.env.GENLAYER_PYTHON,
  process.platform === "win32" && process.env.LOCALAPPDATA
    ? join(process.env.LOCALAPPDATA, "Programs", "Python", "Python312", "python.exe")
    : null,
  process.platform === "win32" ? "py" : "python3",
  "python",
].filter((candidate) => candidate && (candidate === "py" || candidate === "python" || candidate === "python3" || existsSync(candidate)));

let result = null;
for (const command of candidates) {
  const prefix = command === "py" ? ["-3", "-m", "genvm_linter.cli"] : ["-m", "genvm_linter.cli"];
  result = { status: 0 };
  for (const subcommand of [
    ["check", "contracts/semantic_consensus.py", "--json"],
    ["validate", "contracts/semantic_consensus.py", "--json"],
    ["typecheck", "contracts/semantic_consensus.py", "--json"],
  ]) {
    result = spawnSync(command, [...prefix, ...subcommand], { cwd: root, env, stdio: "inherit" });
    if (result.error?.code === "ENOENT" || result.status !== 0) break;
  }
  if (!result.error || result.error.code !== "ENOENT") break;
}

if (!result || result.error) {
  console.error("Unable to find Python for the bundled GenLayer validator. Set GENLAYER_PYTHON to Python 3.12.");
  process.exit(1);
}
process.exit(result.status ?? 1);
