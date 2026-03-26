import { describe, expect, it } from "vitest";

import { loadAssetMap, loadSitePriority } from "../../src/config/loaders";
import { matchPlatformForUrl } from "../../src/router/match-platform";
import { resolveTargetsForAsset } from "../../src/router/resolve-targets";

describe("target resolution", () => {
  it("chooses the first supported platform for an asset using site priority", async () => {
    const assetMap = await loadAssetMap();
    const sitePriority = await loadSitePriority();

    const target = await resolveTargetsForAsset({
      siteId: "bitcoininfonews",
      assetKey: "bitcoin",
      assetMap,
      sitePriority
    });

    expect(target?.platformKey).toBe("coinmarketcap");
    expect(target?.url).toBe("https://coinmarketcap.com/currencies/bitcoin/");
  });

  it("matches a configured platform from a target URL", async () => {
    const match = await matchPlatformForUrl(
      "https://coinmarketcap.com/currencies/bitcoin/"
    );

    expect(match?.platformKey).toBe("coinmarketcap");
    expect(match?.pageType).toBe("coin_detail");
  });

  it("matches CoinMetrics crypto-data URLs", async () => {
    const match = await matchPlatformForUrl(
      "https://charts.coinmetrics.io/crypto-data"
    );

    expect(match?.platformKey).toBe("coinmetrics");
    expect(match?.pageType).toBe("crypto_data");
  });

  it("matches CoinGlass liquidation URLs", async () => {
    const match = await matchPlatformForUrl(
      "https://www.coinglass.com/liquidations"
    );

    expect(match?.platformKey).toBe("coinglass");
    expect(match?.pageType).toBe("liquidations");
  });

  it("matches CoinGlass market-cap heatmap URLs", async () => {
    const match = await matchPlatformForUrl(
      "https://www.coinglass.com/pro/heatmap/market-cap"
    );

    expect(match?.platformKey).toBe("coinglass");
    expect(match?.pageType).toBe("market_cap_heatmap");
  });

  it("matches DeBank wallet profile URLs", async () => {
    const match = await matchPlatformForUrl(
      "https://debank.com/profile/0x7bfee91193d9df2ac0bfe90191d40f23c773c060?chain=_hyperliquid"
    );

    expect(match?.platformKey).toBe("debank");
    expect(match?.pageType).toBe("wallet_profile");
  });

  it("matches DeBank protocol URLs", async () => {
    const match = await matchPlatformForUrl(
      "https://debank.com/protocols/aave3"
    );

    expect(match?.platformKey).toBe("debank");
    expect(match?.pageType).toBe("protocol_detail");
  });

  it("matches TradingView advanced chart URLs", async () => {
    const match = await matchPlatformForUrl(
      "https://www.tradingview.com/chart/?symbol=BITSTAMP%3ABTCUSD"
    );

    expect(match?.platformKey).toBe("tradingview");
    expect(match?.pageType).toBe("chart_page");
  });

  it("matches DexScreener pair URLs", async () => {
    const match = await matchPlatformForUrl(
      "https://dexscreener.com/solana/tzq1j5bzuqynpkps4nb7ce2og6b81lhntukxtfrhrbe"
    );

    expect(match?.platformKey).toBe("dexscreener");
    expect(match?.pageType).toBe("pair_page");
  });

  it("matches CryptoRank token unlock analytics URLs", async () => {
    const match = await matchPlatformForUrl(
      "https://cryptorank.io/token-unlock/analytics#major-token-unlocks"
    );

    expect(match?.platformKey).toBe("cryptorank");
    expect(match?.pageType).toBe("token_unlock_analytics");
  });

  it("matches DappRadar dapp URLs", async () => {
    const match = await matchPlatformForUrl(
      "https://dappradar.com/dapp/world-of-dypians"
    );

    expect(match?.platformKey).toBe("dappradar");
    expect(match?.pageType).toBe("dapp_page");
  });

  it("matches Arkm entity URLs", async () => {
    const match = await matchPlatformForUrl(
      "https://intel.arkm.com/explorer/entity/blackrock"
    );

    expect(match?.platformKey).toBe("arkm");
    expect(match?.pageType).toBe("entity_page");
  });

  it("matches L2BEAT scaling project URLs", async () => {
    const match = await matchPlatformForUrl(
      "https://l2beat.com/scaling/projects/base"
    );

    expect(match?.platformKey).toBe("l2beat");
    expect(match?.pageType).toBe("scaling_project_page");
  });

  it("matches Messari project URLs", async () => {
    const match = await matchPlatformForUrl(
      "https://messari.io/project/bitcoin"
    );

    expect(match?.platformKey).toBe("messari");
    expect(match?.pageType).toBe("project_page");
  });

  it("matches Staking Rewards provider URLs", async () => {
    const match = await matchPlatformForUrl(
      "https://www.stakingrewards.com/provider/nansen"
    );

    expect(match?.platformKey).toBe("stakingrewards");
    expect(match?.pageType).toBe("provider_page");
  });

  it("matches Dune collection URLs", async () => {
    const match = await matchPlatformForUrl(
      "https://dune.com/collection/stablecoins/overview"
    );

    expect(match?.platformKey).toBe("dune");
    expect(match?.pageType).toBe("collection_page");
  });

  it("matches CryptoSlam blockchain URLs", async () => {
    const match = await matchPlatformForUrl(
      "https://www.cryptoslam.io/blockchains/ethereum"
    );

    expect(match?.platformKey).toBe("cryptoslam");
    expect(match?.pageType).toBe("blockchain_page");
  });

  it("matches Token Insight exchange URLs", async () => {
    const match = await matchPlatformForUrl(
      "https://tokeninsight.com/en/exchanges/binance"
    );

    expect(match?.platformKey).toBe("tokeninsight");
    expect(match?.pageType).toBe("exchange_page");
  });

  it("matches Token Terminal project URLs", async () => {
    const match = await matchPlatformForUrl(
      "https://tokenterminal.com/explorer/projects/tether"
    );

    expect(match?.platformKey).toBe("tokenterminal");
    expect(match?.pageType).toBe("project_page");
  });

  it("matches Santiment chart URLs", async () => {
    const match = await matchPlatformForUrl(
      "https://app.santiment.net/charts/social-dominance-bitcoin-23193"
    );

    expect(match?.platformKey).toBe("santiment");
    expect(match?.pageType).toBe("chart_page");
  });
});
