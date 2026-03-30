import { describe, expect, it } from "vitest";

import { classifyArticle } from "../../src/router/classify-article";
import { recommendPlatformsForArticle } from "../../src/router/recommend-platforms";

describe("article classification", () => {
  it("detects derivatives market evidence for open-interest and funding stories", () => {
    const classification = classifyArticle({
      title: "ETH Open Interest Surges 5% in 24 Hours as Funding Rate Turns Positive",
      url: "https://coincu.com/ethereum/eth-open-interest-surges-5-percent-24-hours/"
    });

    expect(classification.evidenceTypes).toContain("derivatives_market");
    expect(classification.evidenceTypes).toContain("spot_market");
  });

  it("detects macro and commodities evidence for gold and yields stories", () => {
    const classification = classifyArticle({
      title: "Gold Falls as Real Yields Rise and Dollar Strengthens",
      url: "https://coincu.com/markets/gold-falls-as-real-yields-rise-dollar-strengthens/"
    });

    expect(classification.evidenceTypes).toContain("macro_rates");
    expect(classification.evidenceTypes).toContain("commodities_fx");
    expect(classification.evidenceTypes).not.toContain("etf_flow");
    expect(classification.evidenceTypes).not.toContain("funding_mna");
  });

  it("detects policy and macro evidence for central-bank and bill stories", () => {
    const fedClassification = classifyArticle({
      title: "Federal Reserve weighs cuts amid inflation, independence",
      url: "https://coincu.com/markets/federal-reserve-weighs-cuts-amid-inflation-independence/"
    });
    const billClassification = classifyArticle({
      title: "Bitcoin holds as U.S. crypto bill targets stablecoin yields",
      url: "https://coincu.com/news/bitcoin-holds-as-u-s-crypto-bill-targets-stablecoin-yields/"
    });

    expect(fedClassification.evidenceTypes).toContain("macro_rates");
    expect(fedClassification.evidenceTypes).toContain("policy_regulatory");
    expect(billClassification.evidenceTypes).toContain("policy_regulatory");
    expect(billClassification.evidenceTypes).toContain("spot_market");
  });

  it("detects claim-check and technical or airdrop patterns for review-heavy articles", () => {
    const technicalClassification = classifyArticle({
      title: "Bitcoin weighs quantum risk as PQC and BIP-360 advance",
      url: "https://coincu.com/bitcoin/bitcoin-weighs-quantum-risk-as-pqc-and-bip-360-advance/"
    });
    const airdropClassification = classifyArticle({
      title: "ROBO faces review amid Fabric airdrop sybil claims",
      url: "https://coincu.com/airdrop/robo-faces-review-amid-fabric-airdrop-sybil-claims/"
    });
    const claimClassification = classifyArticle({
      title: "Farcaster faces scrutiny as MPP IETF draft claim checked",
      url: "https://coincu.com/news/farcaster-faces-scrutiny-as-mpp-ietf-draft-claim-checked/"
    });

    expect(technicalClassification.evidenceTypes).toContain("protocol_technical");
    expect(airdropClassification.evidenceTypes).toContain("airdrop_sybil");
    expect(claimClassification.evidenceTypes).toContain("claim_check");
  });

  it("detects AI-company and geopolitics/security patterns", () => {
    const aiClassification = classifyArticle({
      title: "OpenAI targets 8,000 employees by 2026 amid compute limits",
      url: "https://coincu.com/news/openai-targets-8000-employees-by-2026-amid-compute-limits/"
    });
    const geopoliticsClassification = classifyArticle({
      title: "F-35 faces probe as CENTCOM reviews IRGC hit claim",
      url: "https://coincu.com/news/f-35-faces-probe-as-centcom-reviews-irgc-hit-claim/"
    });

    expect(aiClassification.evidenceTypes).toContain("ai_company_news");
    expect(geopoliticsClassification.evidenceTypes).toContain("geopolitics_security");
    expect(geopoliticsClassification.evidenceTypes).toContain("claim_check");
  });

  it("detects structured-product evidence for leveraged ETF filings on private companies", () => {
    const classification = classifyArticle({
      title: "US Asset Manager Files for 2x Leveraged ETF on SpaceX and Anthropic",
      url: "https://coincu.com/news/us-asset-manager-2x-leveraged-etf-spacex-anthropic/"
    });

    expect(classification.evidenceTypes).toContain("structured_product");
    expect(classification.evidenceTypes).toContain("filing_regulatory");
    expect(classification.evidenceTypes).toContain("etf_flow");
  });

  it("detects options-market evidence for strike and hedging stories", () => {
    const classification = classifyArticle({
      title: "Bitcoin surges past $75,000 as derivatives rally is driven by put-option unwinds",
      url: "https://www.kanalcoin.com/bitcoin-surges-past-75000-derivatives-rally/",
      body: "Analysts cited strike levels, market-maker hedging, and options positioning rather than broad spot demand."
    });

    expect(classification.evidenceTypes).toContain("options_market");
    expect(classification.evidenceTypes).toContain("derivatives_market");
    expect(classification.evidenceTypes).toContain("spot_market");
  });

  it("detects exchange-positioning evidence for Bitfinex longs extremes", () => {
    const classification = classifyArticle({
      title: "Bitcoin long positions on Bitfinex highest since November 2023",
      url: "https://aicryptocore.com/bitcoin-long-positions-bitfinex-highest-since-november-2023/",
      body: "Bitfinex longs climbed to their highest level since November 2023, showing a positioning extreme."
    });

    expect(classification.evidenceTypes).toContain("exchange_positioning");
    expect(classification.evidenceTypes).toContain("spot_market");
  });
});

describe("platform recommendations", () => {
  it("prefers current derivatives platforms for crypto market microstructure stories", async () => {
    const recommendation = await recommendPlatformsForArticle({
      title: "ETH Open Interest Surges 5% in 24 Hours as Funding Rate Turns Positive",
      url: "https://coincu.com/ethereum/eth-open-interest-surges-5-percent-24-hours/"
    });

    expect(recommendation.coverage).toBe("strong");
    expect(recommendation.rankedPlatforms[0]?.platformKey).toBe("coinglass");
    expect(recommendation.rankedPlatforms.map((item) => item.platformKey)).toContain("tradingview");
    expect(recommendation.suggestedSources.map((item) => item.platformKey)).toContain("coinglass");
  });

  it("recommends new macro platforms when the current catalog is weak", async () => {
    const recommendation = await recommendPlatformsForArticle({
      title: "Gold Falls as Real Yields Rise and Dollar Strengthens",
      url: "https://coincu.com/markets/gold-falls-as-real-yields-rise-dollar-strengthens/"
    });

    expect(recommendation.coverage).toBe("strong");
    expect(recommendation.rankedPlatforms[0]?.platformKey).toBe("tradingeconomics");
    expect(recommendation.rankedPlatforms.map((item) => item.platformKey)).toContain("tradingeconomics");
    expect(recommendation.rankedPlatforms.map((item) => item.platformKey)).toContain("cme-fedwatch");
    expect(recommendation.suggestedAdditions).toHaveLength(0);
    expect(recommendation.suggestedSources.map((item) => item.platformKey)).toContain("tradingeconomics");
    expect(recommendation.suggestedSources.map((item) => item.platformKey)).toContain("tradingview");
  });

  it("recommends current or suggested platforms for new evidence families", async () => {
    const aiRecommendation = await recommendPlatformsForArticle({
      title: "OpenAI targets 8,000 employees by 2026 amid compute limits",
      url: "https://coincu.com/news/openai-targets-8000-employees-by-2026-amid-compute-limits/"
    });
    const claimRecommendation = await recommendPlatformsForArticle({
      title: "Farcaster faces scrutiny as MPP IETF draft claim checked",
      url: "https://coincu.com/news/farcaster-faces-scrutiny-as-mpp-ietf-draft-claim-checked/"
    });

    expect(aiRecommendation.rankedPlatforms.map((item) => item.platformKey)).toContain("cryptorank");
    expect(aiRecommendation.rankedPlatforms.map((item) => item.platformKey)).toContain("yahoo-finance");
    expect(aiRecommendation.suggestedAdditions.map((item) => item.platformKey)).toContain("companiesmarketcap");
    expect(aiRecommendation.suggestedSources.map((item) => item.platformKey)).toContain("crunchbase");
    expect(claimRecommendation.rankedPlatforms.map((item) => item.platformKey)).toContain("messari");
  });

  it("prefers filing-first suggestions for structured-product ETF stories", async () => {
    const recommendation = await recommendPlatformsForArticle({
      title: "US Asset Manager Files for 2x Leveraged ETF on SpaceX and Anthropic",
      url: "https://coincu.com/news/us-asset-manager-2x-leveraged-etf-spacex-anthropic/"
    });

    expect(recommendation.evidenceTypes).toContain("structured_product");
    expect(recommendation.rankedPlatforms.map((item) => item.platformKey)).toContain("sec-edgar");
    expect(recommendation.rankedPlatforms.map((item) => item.platformKey)).toContain("yahoo-finance");
    expect(recommendation.suggestedAdditions.map((item) => item.platformKey)).toContain("sosovalue");
    expect(recommendation.suggestedSources.map((item) => item.platformKey)).toContain("companiesmarketcap");
  });

  it("recommends explorer platforms for chain-specific transfer stories", async () => {
    const recommendation = await recommendPlatformsForArticle({
      title: "Whale Withdraws 2,973 ETH From Binance to a New Address",
      url: "https://coincu.com/ethereum/whale-withdraws-2973-eth-binance-new-address/"
    });

    expect(recommendation.coverage).toBe("strong");
    expect(recommendation.rankedPlatforms.map((item) => item.platformKey)).toContain("arkm");
    expect(recommendation.suggestedAdditions.map((item) => item.platformKey)).toContain(
      "etherscan"
    );
    expect(recommendation.suggestedSources.map((item) => item.platformKey)).toContain("etherscan");
  });

  it("prefers options-market sources for options-led BTC rally stories", async () => {
    const recommendation = await recommendPlatformsForArticle({
      title: "Bitcoin surges past $75,000 as derivatives rally is driven by put-option unwinds",
      url: "https://www.kanalcoin.com/bitcoin-surges-past-75000-derivatives-rally/",
      body: "The move was tied to strike positioning, market-maker hedging, and options unwinds."
    });

    expect(recommendation.evidenceTypes).toContain("options_market");
    expect(recommendation.rankedPlatforms.map((item) => item.platformKey)).toContain("deribit");
    expect(recommendation.suggestedSources.map((item) => item.platformKey)).toContain("deribit");
    expect(recommendation.suggestedSources.map((item) => item.platformKey)).toContain("laevitas");
  });

  it("routes Bitfinex-longs stories to exchange-positioning sources", async () => {
    const recommendation = await recommendPlatformsForArticle({
      title: "Bitcoin long positions on Bitfinex highest since November 2023",
      url: "https://aicryptocore.com/bitcoin-long-positions-bitfinex-highest-since-november-2023/",
      body: "Bitfinex longs reached the highest level since November 2023, indicating an exchange-positioning extreme."
    });

    expect(recommendation.evidenceTypes).toContain("exchange_positioning");
    expect(recommendation.rankedPlatforms[0]?.platformKey).toBe("tradingview");
    expect(recommendation.rankedPlatforms.map((item) => item.platformKey)).toContain("coinglass");
    expect(recommendation.suggestedSources.map((item) => item.platformKey)).toContain("tradingview");
  });
});
