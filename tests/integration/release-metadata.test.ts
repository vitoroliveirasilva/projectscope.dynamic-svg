import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";

describe("release metadata", () => {
  it("validates the production release files", () => {
    const result = spawnSync(process.execPath, ["scripts/check-release.mjs"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });

    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
    assert.match(result.stdout, /Release metadata validated for v1\.0\.0/);
  });
});
