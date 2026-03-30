import { describe, expect, it, vi } from "vitest";

import { checkPlatformHealth, classifyProbeResult } from "../../src/platform-health/check-platforms";

describe("platform health classification", () => {
  it("marks Cloudflare challenge pages as blocked", () => {
    const result = classifyProbeResult("https://www.coingecko.com/en/coins/bitcoin", {
      ok: true,
      statusCode: 200,
      finalUrl: "https://www.coingecko.com/en/coins/bitcoin",
      title: "Just a moment...",
      bodySnippet: "Verifying you are human. This may take a few seconds."
    });

    expect(result.status).toBe("blocked");
  });

  it("marks network failures as broken", () => {
    const result = classifyProbeResult("https://example.com", {
      ok: false,
      error: "getaddrinfo ENOTFOUND"
    });

    expect(result.status).toBe("broken");
  });
});

describe("platform health checks", () => {
  it("writes health results for selected platforms", async () => {
    const probe = vi.fn(async () => ({
      ok: true,
      statusCode: 200,
      finalUrl: "https://www.coinglass.com/liquidations",
      title: "Liquidations Dashboard",
      bodySnippet: "BTC liquidations and funding rate data"
    }));
    const selectorChecker = vi.fn(async () => [
      {
        captureKey: "liquidations",
        pageType: "liquidations",
        status: "ready" as const,
        selector: "main"
      }
    ]);

    const result = await checkPlatformHealth(["coinglass"], probe, selectorChecker);

    expect(probe).toHaveBeenCalledOnce();
    expect(selectorChecker).toHaveBeenCalledOnce();
    expect(result.status.platforms.coinglass.status).toBe("healthy");
    expect(result.status.platforms.coinglass.captureChecks?.[0]?.status).toBe("ready");
    expect(result.outputPath).toContain("platform-health-status.json");
  });
});
