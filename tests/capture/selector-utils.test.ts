import { describe, expect, it } from "vitest";

import { toPlaywrightSelector } from "../../src/capture/execute-capture";

describe("selector utils", () => {
  it("keeps CSS selectors unchanged", () => {
    expect(toPlaywrightSelector("#section-coin-chart")).toBe("#section-coin-chart");
  });

  it("converts absolute xpath selectors for Playwright", () => {
    expect(toPlaywrightSelector("/html/body/div[1]")).toBe("xpath=/html/body/div[1]");
  });
});
