import path from "node:path";

import { describe, expect, it } from "vitest";

import { extractAssetsFromArticle } from "../../src/article/extract-assets";
import { normalizeText } from "../../src/article/normalize";
import { readDraftArticle } from "../../src/article/read-draft";
import { loadAssetMap } from "../../src/config/loaders";

describe("article extraction", () => {
  it("reads the draft article and extracts a title from the WordPress-like content", async () => {
    const article = await readDraftArticle(
      path.join(process.cwd(), "draft article.txt")
    );

    expect(article.title).toContain("Bitcoin steadies");
    expect(article.body).toContain("March Survey of Consumer Expectations");
    expect(article.markdownBody).toContain("## Final March one-year-ahead inflation expectations");
    expect(article.markdownBody).toContain(
      "## Why the New York Fed Survey of Consumer Expectations reading matters"
    );
    expect(article.markdownBody).toContain(
      "According [to the](https://coincu.com/press-release/superform-expands-to-the-u-s-with-mobile-app-launch-for-a-user-owned-neobank/)"
    );
  });

  it("normalizes text for asset matching", () => {
    expect(normalizeText("Bitcoin steadies, BTC holds.")).toBe(
      "bitcoin steadies btc holds"
    );
  });

  it("detects bitcoin from the article body using aliases", async () => {
    const article = await readDraftArticle(
      path.join(process.cwd(), "draft article.txt")
    );
    const assetMap = await loadAssetMap();

    const matches = extractAssetsFromArticle(article, assetMap);

    expect(matches.map((match: { assetKey: string }) => match.assetKey)).toContain("bitcoin");
  });
});
