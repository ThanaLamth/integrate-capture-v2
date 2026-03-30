import { describe, expect, it } from "vitest";

import { insertDataNotesBlock } from "../../src/article/insert-data-notes";

describe("data notes insertion", () => {
  it("appends a Data Notes section with bullet lines", () => {
    const markdown = "# Example\n\nBody text.";
    const result = insertDataNotesBlock({
      markdown,
      lines: ["Use coinglass for liquidation context", "Add etherscan for ETH verification"]
    });

    expect(result).toContain("## Data Notes");
    expect(result).toContain("- Use coinglass for liquidation context");
    expect(result).toContain("- Add etherscan for ETH verification");
  });

  it("returns the original markdown when there are no lines", () => {
    const markdown = "# Example\n\nBody text.";
    expect(insertDataNotesBlock({ markdown, lines: [] })).toBe(markdown);
  });
});
