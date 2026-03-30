import { writeFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { planDraftWorkflow } from "../../src/batch/plan-draft";

describe("draft planning workflow", () => {
  it("builds markdown with data notes and platform recommendations from a draft", async () => {
    const articlePath = "/tmp/test-draft-workflow.html";
    await writeFile(
      articlePath,
      [
        '<h1>ETH Open Interest Surges 5% in 24 Hours</h1>',
        "<p>Ethereum open interest rose while funding rate stayed positive.</p>",
        "<p>Traders are watching ETH sentiment and liquidation risk closely.</p>"
      ].join(""),
      "utf8"
    );

    const result = await planDraftWorkflow({
      articlePath
    });

    expect(result.articleTitle).toContain("ETH Open Interest Surges");
    expect(result.platformRecommendation.evidenceTypes).toContain("derivatives_market");
    expect(result.requiredEvidence.length).toBeGreaterThan(0);
    expect(result.requiredEvidence[0]?.dataToCover.length).toBeGreaterThan(0);
    expect(result.visualNeeds.length).toBeGreaterThan(0);
    expect(result.capturePlans.length).toBeGreaterThan(0);
    expect(result.markdown).toContain("## Required Evidence");
    expect(result.markdown).toContain("## Visual Needs");
    expect(result.markdown).toContain("Issue:");
    expect(result.markdown).toContain("Visual to add:");
    expect(result.markdown).toContain("Claim focus:");
    expect(result.markdown).toContain("Suggested platforms:");
    expect(result.markdown).toContain("## Capture Plan");
    expect(result.markdown).toContain("Anchor paragraph:");
    expect(result.markdown).toContain("Caption:");
    expect(result.markdown).toContain("## Data Notes");
    expect(result.markdown).toContain("Suggested current platforms:");
    expect(result.markdown).toContain("Suggested source families:");
    expect(result.markdown).toContain("Draft the evidence blocks first:");
    expect(result.markdown).toContain("<!-- capture:");
    expect(result.markdown).toContain("Source:");
    expect(result.markdown).toContain("Insert evidence captures only after measurable claims:");
  });

  it("anchors captures to evidence paragraphs instead of the title line", async () => {
    const articlePath = "/tmp/test-draft-anchor-workflow.html";
    await writeFile(
      articlePath,
      [
        '<h1>Gold falls as real yields rise, dollar strengthens</h1>',
        "<p>Gold’s decline coincided with rising real yields and stronger dollar demand as traders pared easing bets.</p>",
        "<p>Track the policy path implied by rate futures and how it translates into real yields.</p>"
      ].join(""),
      "utf8"
    );

    const result = await planDraftWorkflow({
      articlePath
    });

    expect(result.visualNeeds[0]?.anchorText).toContain("Gold’s decline coincided");
    expect(result.capturePlans[0]?.anchorText).not.toBe("Gold falls as real yields rise, dollar strengthens");
    expect(result.capturePlans[0]?.anchorText).toContain("Gold’s decline coincided");
  });

  it("chooses non-BTC subject routes for oil-led macro stories", async () => {
    const articlePath = "/tmp/test-draft-oil-route.html";
    await writeFile(
      articlePath,
      [
        '<h1>US diesel prices near $5 as Iran war risk threatens global supply</h1>',
        "<p>Oil and diesel prices jumped as traders priced supply risk in the Middle East.</p>",
        "<p>Bitcoin stayed secondary to the energy shock and broader inflation concerns.</p>"
      ].join(""),
      "utf8"
    );

    const result = await planDraftWorkflow({
      articlePath,
      siteId: "kanalcoin"
    });

    expect(result.capturePlans[0]?.captureUrl).toMatch(/usoil|crude-oil/i);
    expect(result.visualNeeds[0]?.visualToAdd.toLowerCase()).toContain("chart");
    expect(["tradingview", "tradingeconomics"]).toContain(result.capturePlans[0]?.platformKey);
    expect(result.capturePlans[0]?.sourceLabel.toLowerCase()).toContain("oil");
    expect(result.capturePlans[0]?.caption).toContain("Source:");
  });
});
