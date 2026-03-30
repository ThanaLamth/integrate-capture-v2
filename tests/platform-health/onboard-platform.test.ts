import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { onboardPlatform } from "../../src/platform-health/onboard-platform";

const originalCwd = process.cwd();

afterEach(() => {
  process.chdir(originalCwd);
});

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

describe("platform onboarding", () => {
  it("scaffolds a platform config and moves suggested metadata into current platforms", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "platform-onboard-"));
    await mkdir(path.join(root, "configs", "platforms"), { recursive: true });

    await writeJson(path.join(root, "configs", "platform-catalog.json"), {
      currentPlatforms: [
        {
          platformKey: "coingecko",
          category: "market-overview",
          supportsEvidence: ["spot_market"],
          strengths: ["token overview"]
        }
      ],
      recommendedPlatforms: [
        {
          platformKey: "etherscan",
          supportsEvidence: ["onchain_transfer"],
          reason: "Best source for ETH wallet verification."
        }
      ]
    });
    await writeJson(path.join(root, "configs", "platform-health-targets.json"), {
      targets: [
        {
          platformKey: "coingecko",
          sampleUrl: "https://www.coingecko.com/en/coins/bitcoin"
        }
      ]
    });

    process.chdir(root);

    const result = await onboardPlatform({
      platformKey: "etherscan",
      sampleUrl: "https://etherscan.io/address/0x0000000000000000000000000000000000000000"
    });

    const config = JSON.parse(await readFile(result.configPath, "utf8"));
    const catalog = JSON.parse(await readFile(result.catalogPath, "utf8"));
    const healthTargets = JSON.parse(await readFile(result.healthTargetsPath, "utf8"));

    expect(config.platformKey).toBe("etherscan");
    expect(config.captures[0].captureKey).toBe("primary_view");
    expect(catalog.currentPlatforms.map((item: { platformKey: string }) => item.platformKey)).toContain(
      "etherscan"
    );
    expect(catalog.recommendedPlatforms).toHaveLength(0);
    expect(healthTargets.targets.map((item: { platformKey: string }) => item.platformKey)).toContain(
      "etherscan"
    );
    expect(result.usedSuggestedMetadata).toBe(true);
  });
});
