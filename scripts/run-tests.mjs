import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const argumentsSet = new Set(process.argv.slice(2));
const suiteArgument = process.argv.find((argument) => argument.startsWith("--suite="));
const suite = suiteArgument?.slice("--suite=".length);
const coverage = argumentsSet.has("--coverage");
const passWithNoTests = argumentsSet.has("--pass-with-no-tests");
const testsRoot = resolve("dist-test", "tests");

async function findTestFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findTestFiles(path)));
    } else if (entry.isFile() && entry.name.endsWith(".test.js")) {
      files.push(path);
    }
  }

  return files.sort();
}

const searchRoot = suite ? resolve(testsRoot, suite) : testsRoot;
let testFiles = [];

try {
  testFiles = await findTestFiles(searchRoot);
} catch (error) {
  if (!passWithNoTests) {
    throw error;
  }
}

if (testFiles.length === 0) {
  if (passWithNoTests) {
    console.log("No matching tests found.");
    process.exit(0);
  }

  throw new Error("No matching tests found.");
}

const nodeArguments = [
  "--test",
  ...(coverage ? ["--experimental-test-coverage"] : []),
  ...testFiles,
];
const result = spawnSync(process.execPath, nodeArguments, { stdio: "inherit" });

process.exit(result.status ?? 1);
