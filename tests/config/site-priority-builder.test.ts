import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildSitePriorityFromCsv } from "../../src/config/site-priority-builder";

describe("site priority builder", () => {
  it("builds ranked platform order from the CSV", async () => {
    const csvPath = path.join(
      process.cwd(),
      "site_platform_fit_sorted_by_site_2026-03-25.csv"
    );

    const priorities = await buildSitePriorityFromCsv(csvPath);

    expect(priorities.bitcoininfonews).toEqual([
      "blockchair",
      "coinmetrics",
      "cryptoquant",
      "glassnode",
      "coingecko",
      "coinglass"
    ]);

    expect(priorities.coincu).toEqual([
      "coingecko",
      "defillama",
      "glassnode",
      "coinmetrics",
      "cryptoquant",
      "messari"
    ]);
  });
});
