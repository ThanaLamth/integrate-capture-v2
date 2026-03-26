import { describe, expect, it } from "vitest";

import { resolveHeadlessMode } from "../../src/capture/execute-capture";

describe("resolveHeadlessMode", () => {
  it("forces CoinGecko captures to headed mode by default", () => {
    expect(resolveHeadlessMode("coingecko", undefined)).toBe(false);
  });

  it("forces DefiLlama captures to headed mode by default", () => {
    expect(resolveHeadlessMode("defillama", undefined)).toBe(false);
  });

  it("forces CryptoQuant captures to headed mode by default", () => {
    expect(resolveHeadlessMode("cryptoquant", undefined)).toBe(false);
  });

  it("forces Glassnode captures to headed mode by default", () => {
    expect(resolveHeadlessMode("glassnode", undefined)).toBe(false);
  });

  it("forces Santiment captures to headless mode by default", () => {
    expect(resolveHeadlessMode("santiment", undefined)).toBe(true);
  });

  it("keeps explicit headless requests for non-CoinGecko platforms", () => {
    expect(resolveHeadlessMode("coinmarketcap", undefined)).toBe(true);
    expect(resolveHeadlessMode("coinmarketcap", false)).toBe(false);
    expect(resolveHeadlessMode("defillama", true)).toBe(true);
    expect(resolveHeadlessMode("cryptoquant", true)).toBe(true);
    expect(resolveHeadlessMode("glassnode", true)).toBe(true);
    expect(resolveHeadlessMode("santiment", false)).toBe(false);
  });
});
