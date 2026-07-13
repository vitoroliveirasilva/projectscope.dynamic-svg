import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const errors = [];

async function readText(path) {
  return readFile(resolve(root, path), "utf8");
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

const packageJson = await readJson("package.json");
const packageLock = await readJson("package-lock.json");
const version = packageJson.version;
const readme = await readText("README.md");
const netlify = await readText("netlify.toml");
const landingPage = await readText("public/index.html");

assert(/^\d+\.\d+\.\d+$/.test(version), "package.json must use a stable semantic version.");

assert(packageLock.version === version, "package-lock.json version must match package.json.");

assert(
  packageLock.packages?.[""]?.version === version,
  "package-lock.json root package version must match package.json.",
);

assert(readme.includes(`version-${version}`), "README version badge is outdated.");

assert(
  readme.includes("https://projectscope-dynamic-svg.netlify.app"),
  "README must reference the production domain.",
);

assert(!readme.includes("<DOMINIO_DO_DEPLOY>"), "README still contains deploy placeholders.");

assert(/publish\s*=\s*"public"/.test(netlify), "Netlify publish directory must be public.");

assert(netlify.includes('NPM_FLAGS = "--include=dev"'), "Netlify must install build dependencies.");

assert(
  landingPage.includes("/api/cards/now-building.svg"),
  "Landing page must include Now Building.",
);

assert(
  landingPage.includes("/api/cards/project-radar.svg"),
  "Landing page must include Project Radar.",
);

assert(!/<script(?:\s|>)/i.test(landingPage), "Landing page must not include scripts.");

if (errors.length > 0) {
  console.error("Release metadata validation failed:");

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  process.exit(1);
}

console.log(`Release metadata validated for v${version}.`);
