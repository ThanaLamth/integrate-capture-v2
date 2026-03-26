import { describe, expect, it, vi } from "vitest";

import { prepareSantimentPage } from "../../src/capture/prepare-santiment";

describe("prepareSantimentPage", () => {
  it("dismisses overlays and hides pro metrics before capture on Santiment chart pages", async () => {
    const voteCloseClick = vi.fn(async () => undefined);
    const betaCloseClick = vi.fn(async () => undefined);
    const allowAllClick = vi.fn(async () => undefined);
    const hideClick = vi.fn(async () => undefined);
    const waitFor = vi.fn(async () => undefined);
    const allowAllButton = { click: allowAllClick, waitFor };
    const hideButton = { click: hideClick, waitFor };
    const chartRoot = { waitFor };
    const page = {
      getByRole: vi.fn((_role: string, options: { name?: string }) => {
        if (options?.name === "Allow all") {
          return allowAllButton;
        }
        if (options?.name === "Hide Pro Metrics") {
          return hideButton;
        }

        return allowAllButton;
      }),
      locator: vi.fn((selector: string) => {
        if (
          selector ===
          "//div[@role='dialog'][contains(.,'Vote for Santiment!')]//button"
        ) {
          return { first: () => ({ click: voteCloseClick, waitFor }) };
        }
        if (
          selector ===
          "//div[@role='dialog'][contains(.,'New Charts beta is open!')]//button"
        ) {
          return { first: () => ({ click: betaCloseClick, waitFor }) };
        }
        if (selector === "div.widget.column.svelte-veo1tu") {
          return chartRoot;
        }

        return chartRoot;
      }),
      evaluate: vi.fn(async () => undefined),
      waitForTimeout: vi.fn(async () => undefined)
    };

    await prepareSantimentPage(
      page as never,
      "https://app.santiment.net/charts/social-dominance-bitcoin-23193"
    );

    expect(page.getByRole).toHaveBeenCalledWith("button", {
      name: "Allow all"
    });
    expect(page.getByRole).toHaveBeenCalledWith("button", {
      name: "Hide Pro Metrics"
    });
    expect(page.locator).toHaveBeenCalledWith(
      "//div[@role='dialog'][contains(.,'Vote for Santiment!')]//button"
    );
    expect(page.locator).toHaveBeenCalledWith(
      "//div[@role='dialog'][contains(.,'New Charts beta is open!')]//button"
    );
    expect(voteCloseClick).toHaveBeenCalledTimes(1);
    expect(betaCloseClick).toHaveBeenCalledTimes(1);
    expect(allowAllClick).toHaveBeenCalledTimes(1);
    expect(hideClick).toHaveBeenCalledTimes(1);
    expect(page.evaluate).toHaveBeenCalledTimes(2);
    expect(page.locator).toHaveBeenCalledWith("div.widget.column.svelte-veo1tu");
    expect(waitFor).toHaveBeenCalledWith({
      state: "visible",
      timeout: 15000
    });
    expect(page.waitForTimeout).toHaveBeenCalledWith(3000);
  });

  it("does nothing for non-Santiment URLs", async () => {
    const page = {
      getByRole: vi.fn(),
      locator: vi.fn(),
      evaluate: vi.fn(async () => undefined),
      waitForTimeout: vi.fn(async () => undefined)
    };

    await prepareSantimentPage(page as never, "https://messari.io/project/bitcoin");

    expect(page.getByRole).not.toHaveBeenCalled();
    expect(page.locator).not.toHaveBeenCalled();
    expect(page.evaluate).not.toHaveBeenCalled();
    expect(page.waitForTimeout).not.toHaveBeenCalled();
  });
});
