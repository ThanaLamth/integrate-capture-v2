import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseCliArgs } from "../../src/cli/index";

describe("README commands", () => {
  it("documents the supported CLI flags", async () => {
    const readme = await readFile(path.join(process.cwd(), "README.md"), "utf8");

    expect(readme).toContain("--article");
    expect(readme).toContain("--site");
    expect(readme).toContain("--dry-run");
  });

  it("parses the documented dry-run command shape", () => {
    const parsed = parseCliArgs([
      "--article",
      "draft article.txt",
      "--site",
      "bitcoininfonews",
      "--dry-run"
    ]);

    expect(parsed).toEqual({
      articlePath: "draft article.txt",
      siteId: "bitcoininfonews",
      dryRun: true
    });
  });

  it("defaults to live mode when --dry-run is omitted", () => {
    const parsed = parseCliArgs([
      "--article",
      "draft article.txt",
      "--site",
      "bitcoininfonews"
    ]);

    expect(parsed).toEqual({
      articlePath: "draft article.txt",
      siteId: "bitcoininfonews",
      dryRun: false
    });
  });
});
