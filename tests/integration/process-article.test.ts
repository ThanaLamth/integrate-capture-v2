import path from "node:path";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";

import { describe, expect, it } from "vitest";

import { processArticle } from "../../src/batch/process-article";

describe("process article", () => {
  it("processes the local draft in dry-run mode and plans a capture", async () => {
    const articlePath = path.join(os.tmpdir(), "process-article-dry-run.html");
    await writeFile(
      articlePath,
      "<h1>Bitcoin holds near resistance</h1><p>Bitcoin price hovered near a key level as traders watched sentiment.</p>",
      "utf8"
    );

    const result = await processArticle({
      articlePath,
      siteId: "bitcoininfonews",
      dryRun: true,
      timestamp: "20260325T160500"
    });

    expect(result.matches.map((match: { assetKey: string }) => match.assetKey)).toContain("bitcoin");
    expect(result.targets[0]?.platformKey).toBe("coinmarketcap");
    expect(result.markdown).toContain("<!-- capture:bitcoin:coinmarketcap:price_chart -->");
    expect(result.markdown).toContain("../images/");
  });

  it("writes local output files in live mode using the capture executor", async () => {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "capture-flow-"));
    const articlePath = path.join(os.tmpdir(), "process-article-live-run.html");
    await writeFile(
      articlePath,
      "<h1>Bitcoin holds near resistance</h1><p>Bitcoin price hovered near a key level as traders watched sentiment.</p>",
      "utf8"
    );

    const result = await processArticle({
      articlePath,
      siteId: "bitcoininfonews",
      dryRun: false,
      outputRoot,
      timestamp: "20260325T160500",
      captureExecutor: async ({ outputPath }) => {
        await writeFile(outputPath, new Uint8Array([137, 80, 78, 71]));
        return {
          outputPath,
          selectorUsed: "main",
          mode: "element",
          pageContext: {
            pageTitle: "Bitcoin market page",
            summary: "Bitcoin market page: BTC traded near a key level",
            dataPoints: ["BTC traded near a key level", "Volume stayed elevated"]
          }
        };
      }
    });

    const articleOutput = await readFile(result.articlePath!, "utf8");
    const metadataOutput = await readFile(result.metadataPaths[0]!, "utf8");

    expect(result.imagePaths[0]).toContain(`${path.sep}images${path.sep}`);
    expect(articleOutput).toContain("<!-- capture:bitcoin:coinmarketcap:price_chart -->");
    expect(articleOutput).toContain("Key data:");
    expect(metadataOutput).toContain("\"selectorUsed\": \"main\"");
    expect(metadataOutput).toContain("\"pageContext\"");
  });
});
