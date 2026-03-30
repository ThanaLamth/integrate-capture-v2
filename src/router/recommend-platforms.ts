import { loadPlatformCatalog, loadPlatformHealthStatus } from "../config/loaders";
import type {
  EvidenceType,
  PlatformCatalogEntry,
  PlatformHealthEntry,
  RecommendedPlatform
} from "../config/schema";
import { classifyArticle, type ArticleRoutingInput } from "./classify-article";

export interface RankedPlatform {
  platformKey: string;
  score: number;
  matchedEvidence: EvidenceType[];
  strengths: string[];
  healthStatus?: PlatformHealthEntry["status"];
  captureReady: boolean;
  readyCaptureKeys: string[];
}

export interface RecommendedPlatformToAdd {
  platformKey: string;
  reason: string;
  matchedEvidence: EvidenceType[];
}

export interface SuggestedSource {
  platformKey: string;
  reason: string;
  matchedEvidence: EvidenceType[];
  triggeredBy: string[];
  availability: "current" | "recommended";
}

export interface PlatformRecommendation {
  evidenceTypes: EvidenceType[];
  matchedSignals: string[];
  coverage: "strong" | "partial" | "weak";
  rankedPlatforms: RankedPlatform[];
  suggestedAdditions: RecommendedPlatformToAdd[];
  suggestedSources: SuggestedSource[];
}

interface SourceSuggestionRule {
  triggeredBy: string[];
  platformKeys: string[];
  reason: string;
}

const SOURCE_SUGGESTION_RULES: SourceSuggestionRule[] = [
  {
    triggeredBy: ["jobless claims", "layoffs", "unemployment", "pmi", "survey"],
    platformKeys: ["tradingeconomics", "cme-fedwatch"],
    reason: "Strong source family for macro releases, labor data, and policy expectations."
  },
  {
    triggeredBy: ["fed", "federal reserve", "powell", "rate cut", "rate hold", "rate hike", "dot plot", "sofr", "fedwatch"],
    platformKeys: ["cme-fedwatch", "tradingeconomics", "tradingview"],
    reason: "Best source family for rate-path, Fed repricing, and macro market context."
  },
  {
    triggeredBy: ["gold", "oil", "brent", "lng", "natural gas", "eur/usd", "dollar"],
    platformKeys: ["tradingeconomics", "tradingview", "yahoo-finance"],
    reason: "Best source family for commodities, FX, and cross-asset price context."
  },
  {
    triggeredBy: ["etf", "etp", "inflow", "outflow"],
    platformKeys: ["sosovalue", "farside", "sec-edgar", "yahoo-finance"],
    reason: "Best source family for ETF product, flow, and market context."
  },
  {
    triggeredBy: ["sec", "files", "filing", "cftc", "mas", "leveraged etf", "structured product", "private company", "spacex", "anthropic"],
    platformKeys: ["sec-edgar", "yahoo-finance", "companiesmarketcap"],
    reason: "Best source family for filing-backed product stories and issuer context."
  },
  {
    triggeredBy: ["whale", "wallet", "address", "transfer", "withdraw", "deposit", "on-chain"],
    platformKeys: ["arkm", "debank", "etherscan", "solscan", "xrpscan", "mempool"],
    reason: "Best source family for on-chain movement and wallet verification."
  },
  {
    triggeredBy: ["open interest", "funding rate", "liquidation", "short position", "long liquidation"],
    platformKeys: ["coinglass", "cryptoquant", "glassnode"],
    reason: "Best source family for derivatives positioning and liquidation context."
  },
  {
    triggeredBy: ["bitfinex longs", "bitfinex shorts", "long positions", "short positions", "highest since"],
    platformKeys: ["tradingview", "coinglass", "cryptoquant"],
    reason: "Best source family for exchange-specific positioning charts and positioning extremes."
  },
  {
    triggeredBy: [
      "options",
      "put-option",
      "call-option",
      "strike",
      "max pain",
      "implied volatility",
      "gamma",
      "hedging",
      "market maker"
    ],
    platformKeys: ["deribit", "laevitas", "amberdata", "coinglass"],
    reason: "Best source family for crypto options positioning, strikes, and hedging mechanics."
  },
  {
    triggeredBy: ["dao", "proposal", "vote", "oversight", "ceo search"],
    platformKeys: ["snapshot", "tally", "dune"],
    reason: "Best source family for governance and proposal evidence."
  },
  {
    triggeredBy: ["ai", "openai", "copilot", "alexa", "deepseek", "compute", "employees", "windows", "mac"],
    platformKeys: ["yahoo-finance", "companiesmarketcap", "crunchbase"],
    reason: "Best source family for AI company, valuation, and funding context."
  },
  {
    triggeredBy: ["funding round", "acquires", "acquisition", "deal", "investment", "ipo", "fund", "sells"],
    platformKeys: ["crunchbase", "yahoo-finance", "companiesmarketcap"],
    reason: "Best source family for funding, M&A, and IPO context."
  },
  {
    triggeredBy: ["airdrop", "sybil", "fake ads"],
    platformKeys: ["snapshot", "dune"],
    reason: "Useful source family for airdrop, sybil, and participation-pattern stories."
  }
];

const PLATFORM_EVIDENCE_BONUSES: Partial<Record<EvidenceType, Partial<Record<string, number>>>> = {
  derivatives_market: {
    coinglass: 8,
    cryptoquant: 6,
    glassnode: 4,
    deribit: 1
  },
  exchange_positioning: {
    tradingview: 12,
    coinglass: 4,
    cryptoquant: 5
  },
  options_market: {
    deribit: 9,
    laevitas: 8,
    amberdata: 7,
    coinglass: 2
  },
  macro_rates: {
    tradingeconomics: 8,
    "cme-fedwatch": 7,
    tradingview: 2
  },
  commodities_fx: {
    tradingeconomics: 8,
    tradingview: 4,
    "yahoo-finance": 3
  },
  filing_regulatory: {
    "sec-edgar": 9,
    "yahoo-finance": 2
  },
  structured_product: {
    "sec-edgar": 7,
    "yahoo-finance": 5,
    companiesmarketcap: 4
  },
  onchain_transfer: {
    arkm: 6,
    debank: 5,
    etherscan: 5,
    solscan: 5,
    xrpscan: 5,
    mempool: 5
  }
};

function specializationBonus(platformKey: string, matchedEvidence: EvidenceType[]): number {
  return matchedEvidence.reduce((total, evidenceType) => {
    return total + (PLATFORM_EVIDENCE_BONUSES[evidenceType]?.[platformKey] ?? 0);
  }, 0);
}

function scorePlatform(
  platform: PlatformCatalogEntry,
  evidenceTypes: EvidenceType[],
  healthEntry?: PlatformHealthEntry
): RankedPlatform | null {
  const matchedEvidence = platform.supportsEvidence.filter((evidence) =>
    evidenceTypes.includes(evidence)
  );

  if (matchedEvidence.length === 0) {
    return null;
  }

  const readyCaptureKeys =
    healthEntry?.captureChecks
      ?.filter((check) => check.status === "ready")
      .map((check) => check.captureKey) ?? [];
  const captureReady = readyCaptureKeys.length > 0;
  const hasCaptureChecks = (healthEntry?.captureChecks?.length ?? 0) > 0;
  const criticalEvidenceBonus =
    matchedEvidence.includes("exchange_positioning") ? 8 : 0;
  const healthPenalty =
    healthEntry?.status === "blocked"
      ? -20
      : healthEntry?.status === "broken"
        ? -30
        : hasCaptureChecks && !captureReady
          ? -10
          : 0;
  const healthBonus =
    captureReady
      ? 8 + readyCaptureKeys.length
      : healthEntry?.status === "healthy"
        ? 2
        : 0;

  return {
    platformKey: platform.platformKey,
    score:
      matchedEvidence.length * 10 +
      criticalEvidenceBonus +
      platform.strengths.length +
      specializationBonus(platform.platformKey, matchedEvidence) +
      healthBonus +
      healthPenalty,
    matchedEvidence,
    strengths: platform.strengths,
    healthStatus: healthEntry?.status,
    captureReady,
    readyCaptureKeys
  };
}

function suggestAdditions(
  evidenceTypes: EvidenceType[],
  recommendedPlatforms: RecommendedPlatform[]
): RecommendedPlatformToAdd[] {
  return recommendedPlatforms
    .map((platform) => {
      const matchedEvidence = platform.supportsEvidence.filter((evidence) =>
        evidenceTypes.includes(evidence)
      );

      if (matchedEvidence.length === 0) {
        return null;
      }

      return {
        platformKey: platform.platformKey,
        reason: platform.reason,
        matchedEvidence
      };
    })
    .filter((platform): platform is RecommendedPlatformToAdd => platform !== null)
    .sort((left, right) => right.matchedEvidence.length - left.matchedEvidence.length)
    .filter(
      (platform, index, list) =>
        list.findIndex((entry) => entry.platformKey === platform.platformKey) === index
    );
}

function suggestSources(
  matchedSignals: string[],
  evidenceTypes: EvidenceType[],
  rankedPlatforms: RankedPlatform[],
  currentPlatforms: PlatformCatalogEntry[],
  recommendedPlatforms: RecommendedPlatform[]
): SuggestedSource[] {
  const currentMap = new Map(currentPlatforms.map((platform) => [platform.platformKey, platform]));
  const recommendedMap = new Map(
    recommendedPlatforms.map((platform) => [platform.platformKey, platform])
  );
  const rankedMap = new Map(rankedPlatforms.map((platform) => [platform.platformKey, platform]));
  const suggestions = new Map<string, SuggestedSource>();

  for (const rule of SOURCE_SUGGESTION_RULES) {
    const triggeredBy = rule.triggeredBy.filter((signal) => matchedSignals.includes(signal));
    if (triggeredBy.length === 0) {
      continue;
    }

    for (const platformKey of rule.platformKeys) {
      const current = currentMap.get(platformKey);
      const recommended = recommendedMap.get(platformKey);
      const supportsEvidence = current?.supportsEvidence ?? recommended?.supportsEvidence ?? [];
      const matchedEvidence = supportsEvidence.filter((evidence) => evidenceTypes.includes(evidence));

      if (matchedEvidence.length === 0) {
        continue;
      }

      const existing = suggestions.get(platformKey);
      const availability: SuggestedSource["availability"] = current ? "current" : "recommended";
      const reason = current?.notes ?? recommended?.reason ?? rule.reason;
      const mergedSignals = Array.from(new Set([...(existing?.triggeredBy ?? []), ...triggeredBy]));
      const mergedEvidence = Array.from(
        new Set([...(existing?.matchedEvidence ?? []), ...matchedEvidence])
      );

      suggestions.set(platformKey, {
        platformKey,
        reason,
        matchedEvidence: mergedEvidence,
        triggeredBy: mergedSignals,
        availability
      });
    }
  }

  return Array.from(suggestions.values()).sort((left, right) => {
    const leftRank = rankedMap.get(left.platformKey)?.score ?? -1;
    const rightRank = rankedMap.get(right.platformKey)?.score ?? -1;

    return (
      right.matchedEvidence.length - left.matchedEvidence.length ||
      right.triggeredBy.length - left.triggeredBy.length ||
      rightRank - leftRank ||
      left.platformKey.localeCompare(right.platformKey)
    );
  });
}

function classifyCoverage(evidenceTypes: EvidenceType[], rankedPlatforms: RankedPlatform[]): "strong" | "partial" | "weak" {
  const usablePlatforms = rankedPlatforms.filter(
    (platform) =>
      platform.healthStatus !== "blocked" &&
      platform.healthStatus !== "broken" &&
      (platform.captureReady || platform.healthStatus === undefined || platform.healthStatus === "healthy")
  );

  if (usablePlatforms.length === 0) {
    return "weak";
  }

  const coveredEvidence = new Set(usablePlatforms.flatMap((platform) => platform.matchedEvidence));

  if (coveredEvidence.size === evidenceTypes.length) {
    return "strong";
  }

  if (coveredEvidence.size >= Math.max(1, Math.floor(evidenceTypes.length / 2))) {
    return "partial";
  }

  return "weak";
}

function signalPriority(platformKey: string, matchedSignals: string[]): number {
  if (
    matchedSignals.some((signal) =>
      ["bitfinex longs", "bitfinex shorts", "long positions", "short positions", "highest since", "positioning"].includes(signal)
    )
  ) {
    if (platformKey === "tradingview") {
      return 20;
    }

    if (platformKey === "coinglass" || platformKey === "cryptoquant") {
      return 5;
    }
  }

  return 0;
}

export async function recommendPlatformsForArticle(
  input: ArticleRoutingInput
): Promise<PlatformRecommendation> {
  const classification = classifyArticle(input);
  const catalog = await loadPlatformCatalog();
  const healthStatus = await loadPlatformHealthStatus();

  const rankedPlatforms = catalog.currentPlatforms
    .map((platform) =>
      scorePlatform(platform, classification.evidenceTypes, healthStatus?.platforms[platform.platformKey])
    )
    .filter((platform): platform is RankedPlatform => platform !== null)
    .sort(
      (left, right) =>
        (right.score + signalPriority(right.platformKey, classification.matchedSignals)) -
          (left.score + signalPriority(left.platformKey, classification.matchedSignals)) ||
        left.platformKey.localeCompare(right.platformKey)
    );

  const suggestedAdditions = suggestAdditions(classification.evidenceTypes, catalog.recommendedPlatforms);
  const suggestedSources = suggestSources(
    classification.matchedSignals,
    classification.evidenceTypes,
    rankedPlatforms,
    catalog.currentPlatforms,
    catalog.recommendedPlatforms
  );

  return {
    evidenceTypes: classification.evidenceTypes,
    matchedSignals: classification.matchedSignals,
    coverage: classifyCoverage(classification.evidenceTypes, rankedPlatforms),
    rankedPlatforms,
    suggestedAdditions,
    suggestedSources
  };
}
