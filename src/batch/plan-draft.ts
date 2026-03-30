import path from "node:path";

import { extractAssetsFromArticle } from "../article/extract-assets";
import { generateCaption } from "../article/generate-caption";
import { insertCaptureBlock } from "../article/insert-captures";
import { insertDataNotesBlock } from "../article/insert-data-notes";
import { readDraftArticle } from "../article/read-draft";
import { loadAssetMap, loadCaptionProfiles, loadSitePriority } from "../config/loaders";
import { recommendPlatformsForArticle, type PlatformRecommendation } from "../router/recommend-platforms";
import { resolveTargetsForAsset, type ResolvedTarget } from "../router/resolve-targets";
import type { AssetMatch } from "../shared/types";

export interface DraftAssetPlan {
  assetKey: string;
  matchedAlias: string;
  target: ResolvedTarget | null;
}

export interface DraftCapturePlan {
  assetKey: string;
  platformKey: string;
  captureKey: string;
  captureUrl: string;
  anchorText: string;
  rationale: string;
  caption: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface DraftVisualNeed {
  anchorText: string;
  evidenceType: PlatformRecommendation["evidenceTypes"][number];
  issue: string;
  visualToAdd: string;
  suggestedPlatforms: string[];
  priority: "high" | "medium";
}

export interface DraftEvidenceRequirement {
  claim: string;
  evidenceType: PlatformRecommendation["evidenceTypes"][number];
  dataToCover: string[];
  suggestedPlatforms: string[];
  writingInstruction: string;
}

export interface DraftWorkflowPlan {
  articleTitle: string;
  articlePath: string;
  siteId?: string;
  matches: AssetMatch[];
  assetPlans: DraftAssetPlan[];
  requiredEvidence: DraftEvidenceRequirement[];
  visualNeeds: DraftVisualNeed[];
  capturePlans: DraftCapturePlan[];
  platformRecommendation: PlatformRecommendation;
  markdown: string;
}

function buildInitialMarkdown(title: string, body: string): string {
  return [`# ${title}`, "", body].join("\n");
}

function insertSectionBlock(markdown: string, heading: string, lines: string[]): string {
  if (lines.length === 0) {
    return markdown;
  }

  return [markdown.trimEnd(), "", `## ${heading}`, "", ...lines].join("\n");
}

function normalizeForComparison(value: string): string {
  return value
    .toLowerCase()
    .replace(/[`*_#[\]()]/g, " ")
    .replace(/[^\w\s%$./:-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isTitleParagraph(paragraph: string, title: string): boolean {
  return normalizeForComparison(paragraph) === normalizeForComparison(title);
}

function buildDataNotes(
  recommendation: PlatformRecommendation,
  assetPlans: DraftAssetPlan[],
  requiredEvidence: DraftEvidenceRequirement[],
  capturePlans: DraftCapturePlan[]
): string[] {
  const lines: string[] = [];

  if (recommendation.rankedPlatforms.length > 0) {
    const topPlatforms = recommendation.rankedPlatforms.slice(0, 3).map((platform) => {
      const status = platform.captureReady
        ? "capture-ready"
        : platform.healthStatus ?? "unverified";
      return `${platform.platformKey} (${status}) for ${platform.matchedEvidence.join(", ")}`;
    });

    lines.push(`Suggested current platforms: ${topPlatforms.join("; ")}`);
  }

  const missingTargets = assetPlans.filter((plan) => !plan.target);
  if (missingTargets.length > 0) {
    lines.push(
      `No direct asset target configured for: ${missingTargets.map((plan) => plan.assetKey).join(", ")}`
    );
  }

  const additions = recommendation.suggestedAdditions.slice(0, 3);
  if (additions.length > 0) {
    lines.push(
      `If current sources are weak, add: ${additions
        .map((item) => `${item.platformKey} (${item.matchedEvidence.join(", ")})`)
        .join("; ")}`
    );
  }

  const sourceSuggestions = recommendation.suggestedSources.slice(0, 4);
  if (sourceSuggestions.length > 0) {
    lines.push(
      `Suggested source families: ${sourceSuggestions
        .map((item) => `${item.platformKey} [${item.availability}] triggered by ${item.triggeredBy.join("/")}`)
        .join("; ")}`
    );
  }

  if (requiredEvidence.length > 0) {
    lines.push(
      `Draft the evidence blocks first: ${requiredEvidence
        .map((item) => `${item.evidenceType} via ${item.suggestedPlatforms.join("/")}`)
        .join("; ")}`
    );
  }

  if (capturePlans.length > 0) {
    lines.push(
      `Insert evidence captures only after measurable claims: ${capturePlans
        .map((plan) => `${plan.platformKey}/${plan.captureKey}`)
        .join("; ")}`
    );
  }

  return lines;
}

function buildRequiredEvidenceLines(requiredEvidence: DraftEvidenceRequirement[]): string[] {
  return requiredEvidence.flatMap((item, index) => {
    const platforms =
      item.suggestedPlatforms.length > 0 ? item.suggestedPlatforms.join(", ") : "manual review";

    return [
      `${index + 1}. ${item.evidenceType}`,
      `Claim focus: ${item.claim}`,
      `Data to cover: ${item.dataToCover.join("; ")}`,
      `Suggested platforms: ${platforms}`,
      `Writing instruction: ${item.writingInstruction}`,
      ""
    ];
  });
}

function buildCapturePlanLines(capturePlans: DraftCapturePlan[]): string[] {
  return capturePlans.flatMap((plan, index) => [
    `${index + 1}. ${plan.platformKey}/${plan.captureKey}`,
    `Capture URL: ${plan.captureUrl}`,
    `Anchor paragraph: ${plan.anchorText}`,
    `Why here: ${plan.rationale}`,
    `Caption: ${plan.caption}`,
    ""
  ]);
}

function buildVisualNeedLines(visualNeeds: DraftVisualNeed[]): string[] {
  return visualNeeds.flatMap((item, index) => [
    `${index + 1}. ${item.priority.toUpperCase()} ${item.evidenceType}`,
    `Issue: ${item.issue}`,
    `Anchor paragraph: ${item.anchorText}`,
    `Visual to add: ${item.visualToAdd}`,
    `Suggested platforms: ${item.suggestedPlatforms.join(", ") || "manual review"}`,
    ""
  ]);
}

interface SubjectRoute {
  subject: string;
  patterns: RegExp[];
  platformUrls: Partial<Record<string, string>>;
  sourceLabel: string;
}

const SUBJECT_ROUTES: SubjectRoute[] = [
  {
    subject: "xrp_etf_flow",
    patterns: [/\bxrp\b/i, /\betf\b/i, /\binflows?\b|\boutflows?\b|\bnet flows?\b/i],
    platformUrls: {
      sosovalue: "https://m.sosovalue.com/assets/etf/us-xrp-spot",
      farside: "https://farside.co.uk/?p=1518"
    },
    sourceLabel: "SoSoValue US XRP spot ETF flows"
  },
  {
    subject: "bitcoin_etf_flow",
    patterns: [/\bbitcoin\b/i, /\bbtc\b/i, /\betf\b/i, /\binflows?\b|\boutflows?\b|\bnet flows?\b/i],
    platformUrls: {
      sosovalue: "https://m.sosovalue.com/assets/etf/us-btc-spot",
      farside: "https://farside.co.uk/btc/"
    },
    sourceLabel: "SoSoValue US BTC spot ETF flows"
  },
  {
    subject: "ethereum_etf_flow",
    patterns: [/\bethereum\b/i, /\beth\b/i, /\betf\b/i, /\binflows?\b|\boutflows?\b|\bnet flows?\b/i],
    platformUrls: {
      sosovalue: "https://m.sosovalue.com/assets/etf/us-eth-spot",
      farside: "https://farside.co.uk/eth/"
    },
    sourceLabel: "SoSoValue US ETH spot ETF flows"
  },
  {
    subject: "bitfinex_longs",
    patterns: [/\bbitfinex longs?\b/i, /\blong positions?\b/i],
    platformUrls: {
      tradingview: "https://www.tradingview.com/chart/?symbol=BITFINEX%3ABTCUSDLONGS"
    },
    sourceLabel: "TradingView BITFINEX:BTCUSDLONGS"
  },
  {
    subject: "jobless_claims",
    patterns: [/\bjobless claims\b/i, /\blayoffs?\b/i, /\bunemployment\b/i],
    platformUrls: {
      tradingeconomics: "https://tradingeconomics.com/united-states/jobless-claims"
    },
    sourceLabel: "TradingEconomics US Initial Jobless Claims"
  },
  {
    subject: "oil",
    patterns: [/\boil\b/i, /\bcrude\b/i, /\bdiesel\b/i, /\bbrent\b/i],
    platformUrls: {
      tradingview: "https://www.tradingview.com/chart/?symbol=TVC%3AUSOIL",
      tradingeconomics: "https://tradingeconomics.com/commodity/crude-oil"
    },
    sourceLabel: "Oil price chart"
  },
  {
    subject: "gold",
    patterns: [/\bgold\b/i, /\bxauusd\b/i],
    platformUrls: {
      tradingview: "https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD",
      tradingeconomics: "https://tradingeconomics.com/commodity/gold"
    },
    sourceLabel: "Gold price chart"
  },
  {
    subject: "bitcoin",
    patterns: [/\bbitcoin\b/i, /\bbtc\b/i],
    platformUrls: {
      tradingview: "https://www.tradingview.com/chart/?symbol=BITSTAMP%3ABTCUSD"
    },
    sourceLabel: "TradingView BTCUSD chart"
  }
];

function scoreEvidenceParagraph(paragraph: string, aliases: string[]): number {
  const normalized = paragraph.toLowerCase();
  let score = 0;

  if (normalized.length < 60) {
    score -= 3;
  }

  if (/\d/.test(normalized)) {
    score += 2;
  }

  if (/%|\$|million|billion|inflow|outflow|open interest|funding rate|liquidation|yield|volume|tvl|whale|transfer|holdings|etf|premium|discount|oil|diesel|gold|brent|jobless claims|layoffs?|bitfinex longs?|bitfinex shorts?|long positions?|short positions?/.test(normalized)) {
    score += 3;
  }

  if (/because|according to|watch|track|highlights|coincided|means|implied|supports|pressure|demand|expectations|priced|signaling|threatens|risk|surged|jumped/.test(normalized)) {
    score += 2;
  }

  if (/^track\b|^watch\b|what to watch next/.test(normalized)) {
    score -= 2;
  }

  if (aliases.some((alias) => normalized.includes(alias.toLowerCase()))) {
    score += 2;
  }

  if (normalized.length > 220) {
    score -= 1;
  }

  return score;
}

function buildRationale(paragraph: string): string {
  const normalized = paragraph.toLowerCase();

  if (normalized.includes("open interest") || normalized.includes("funding rate")) {
    return "supports the derivatives-market claim in this paragraph";
  }

  if (normalized.includes("liquidation")) {
    return "supports the liquidation-risk claim in this paragraph";
  }

  if (normalized.includes("inflow") || normalized.includes("outflow") || normalized.includes("etf")) {
    return "supports the flow or ETF claim in this paragraph";
  }

  if (normalized.includes("whale") || normalized.includes("transfer") || normalized.includes("address")) {
    return "supports the on-chain movement claim in this paragraph";
  }

  if (normalized.includes("yield") || normalized.includes("dollar") || normalized.includes("gold")) {
    return "supports the macro market claim in this paragraph";
  }

  return "supports the measurable claim in this paragraph";
}

function inferParagraphEvidenceType(
  paragraph: string,
  recommendation: PlatformRecommendation
): PlatformRecommendation["evidenceTypes"][number] {
  const normalized = paragraph.toLowerCase();

  if (/\betf\b/i.test(normalized) && /\binflows?\b|\boutflows?\b|\bnet flows?\b|\bflow reversal\b/i.test(normalized)) {
    return "etf_flow";
  }

  for (const evidenceType of recommendation.evidenceTypes) {
    if (
      (evidenceType === "options_market" &&
        /options?|put-?option|call-?option|strike|gamma|hedging|market maker/i.test(normalized)) ||
      (evidenceType === "derivatives_market" &&
        /open interest|funding rate|liquidation|derivatives?/i.test(normalized)) ||
      (evidenceType === "exchange_positioning" &&
        /bitfinex longs?|bitfinex shorts?|long positions?|short positions?|highest since/i.test(normalized)) ||
      (evidenceType === "onchain_transfer" &&
        /whale|wallet|address|transfer|deposit|withdraw|on-?chain/i.test(normalized)) ||
      (evidenceType === "macro_rates" &&
        /fed|yield|treasury|powell|jobless claims|rate|pmi|survey/i.test(normalized)) ||
      (evidenceType === "commodities_fx" &&
        /gold|oil|brent|lng|natural gas|dollar|eur\/usd/i.test(normalized)) ||
      (evidenceType === "etf_flow" &&
        /etf|inflow|outflow|net flows?|flow reversal|etp/i.test(normalized)) ||
      (evidenceType === "filing_regulatory" &&
        /sec|filing|files|cftc|bureau|mas/i.test(normalized)) ||
      (evidenceType === "spot_market" &&
        /bitcoin|btc|ethereum|eth|xrp|solana|price|support|resistance/i.test(normalized))
    ) {
      return evidenceType;
    }
  }

  return recommendation.evidenceTypes[0] ?? "general_news";
}

function visualInstructionForEvidence(
  evidenceType: PlatformRecommendation["evidenceTypes"][number],
  paragraph: string
): { issue: string; visualToAdd: string; priority: "high" | "medium" } {
  switch (evidenceType) {
    case "options_market":
      return {
        issue: "The paragraph makes an options or hedging claim that should be shown with a direct options graphic.",
        visualToAdd: "Use a chart showing strikes, implied volatility, put/call positioning, or another options-market view tied to the claim.",
        priority: "high"
      };
    case "derivatives_market":
      return {
        issue: "The paragraph makes a derivatives claim without a direct visual proving the positioning or liquidation setup.",
        visualToAdd: "Add a derivatives chart showing open interest, funding, liquidations, or long/short positioning.",
        priority: "high"
      };
    case "exchange_positioning":
      return {
        issue: "The paragraph makes an exchange-specific positioning claim that should be proven with a direct Bitfinex longs or shorts chart.",
        visualToAdd: "Add a chart that directly shows Bitfinex longs or shorts, or BTC price versus Bitfinex longs if the article compares both.",
        priority: "high"
      };
    case "onchain_transfer":
      return {
        issue: "The paragraph cites wallet or transfer activity that should be verified visually.",
        visualToAdd: "Add an explorer or intelligence screenshot showing the address, transfer amount, or wallet movement.",
        priority: "high"
      };
    case "macro_rates":
      return {
        issue: "The paragraph links the story to macro or rate expectations but lacks a direct market or macro visual.",
        visualToAdd: "Add a chart for yields, Fed path, labor data, or the macro indicator driving the move.",
        priority: "medium"
      };
    case "commodities_fx":
      return {
        issue: "The paragraph relies on a commodity or FX move that should be shown directly.",
        visualToAdd: "Add a chart for the relevant oil, gold, dollar, or FX move tied to the paragraph.",
        priority: "medium"
      };
    case "etf_flow":
    case "filing_regulatory":
      return {
        issue: "The paragraph makes a filing or ETF claim that needs a direct source visual or source link.",
        visualToAdd: "Add a filing screenshot, ETF flow table, or use a link-only source if the document is the real evidence.",
        priority: "high"
      };
    case "spot_market":
      return {
        issue: "The paragraph makes a price-structure claim that would be stronger with a direct chart.",
        visualToAdd: "Add a chart showing the exact breakout, support, resistance, or downside level discussed.",
        priority: "medium"
      };
    default:
      return {
        issue: "The paragraph contains a measurable claim that should be paired with a direct evidence visual.",
        visualToAdd: `Add a chart or data graphic that directly proves the point made in: ${paragraph}`,
        priority: "medium"
      };
  }
}

function inferSubjectRoute(paragraph: string): SubjectRoute | null {
  for (const route of SUBJECT_ROUTES) {
    if (route.patterns.some((pattern) => pattern.test(paragraph))) {
      return route;
    }
  }

  return null;
}

function defaultCaptureKey(platformKey: string, fallback: string): string {
  if (platformKey === "tradingview") {
    return "advanced_chart";
  }

  if (platformKey === "tradingeconomics") {
    return "primary_view";
  }

  return fallback;
}

function pickPlatformForParagraph(
  subjectRoute: SubjectRoute | null,
  recommendation: PlatformRecommendation,
  fallbackPlatformKey: string
): string {
  if (!subjectRoute) {
    return fallbackPlatformKey;
  }

  const rankedMatch = recommendation.rankedPlatforms.find(
    (platform) => subjectRoute.platformUrls[platform.platformKey]
  );
  if (rankedMatch) {
    return rankedMatch.platformKey;
  }

  const suggestedMatch = recommendation.suggestedAdditions.find(
    (platform) => subjectRoute.platformUrls[platform.platformKey]
  );
  if (suggestedMatch) {
    return suggestedMatch.platformKey;
  }

  const routePlatformKey = Object.keys(subjectRoute.platformUrls)[0];
  return routePlatformKey ?? fallbackPlatformKey;
}

function shouldUseResolvedAssetTarget(
  visualNeed: DraftVisualNeed,
  matchingAssetPlan: DraftAssetPlan | undefined
): boolean {
  if (!matchingAssetPlan?.target) {
    return false;
  }

  return visualNeed.suggestedPlatforms.includes(matchingAssetPlan.target.platformKey);
}

function buildVisualNeeds(
  markdown: string,
  title: string,
  matches: AssetMatch[],
  recommendation: PlatformRecommendation
): DraftVisualNeed[] {
  const paragraphs = markdown
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(
      (paragraph) =>
        paragraph.length > 0 &&
        !paragraph.startsWith("#") &&
        !isTitleParagraph(paragraph, title)
    );
  const aliases = matches.map((match) => match.matchedAlias);
  const seen = new Set<string>();

  return paragraphs
    .map((paragraph, index) => ({
      paragraph,
      score: scoreEvidenceParagraph(paragraph, aliases) - index
    }))
    .filter((entry) => entry.score >= 3)
    .sort((left, right) => right.score - left.score || left.paragraph.length - right.paragraph.length)
    .slice(0, 3)
    .map((entry) => {
      const evidenceType = inferParagraphEvidenceType(entry.paragraph, recommendation);
      const suggestedPlatforms = topPlatformsForEvidence(recommendation, evidenceType);
      const instruction = visualInstructionForEvidence(evidenceType, entry.paragraph);
      const dedupeKey = `${evidenceType}:${suggestedPlatforms.join(",")}:${inferSubjectRoute(entry.paragraph)?.subject ?? "generic"}`;

      if (seen.has(dedupeKey)) {
        return null;
      }

      seen.add(dedupeKey);

      return {
        anchorText: entry.paragraph,
        evidenceType,
        issue: instruction.issue,
        visualToAdd: instruction.visualToAdd,
        suggestedPlatforms,
        priority: instruction.priority
      };
    })
    .filter((item): item is DraftVisualNeed => item !== null);
}

function buildCapturePlans(
  visualNeeds: DraftVisualNeed[],
  matches: AssetMatch[],
  assetPlans: DraftAssetPlan[],
  recommendation: PlatformRecommendation,
  siteId: string | undefined,
  captionProfile: import("../config/schema").CaptionProfile
): DraftCapturePlan[] {
  const topPlatform = recommendation.rankedPlatforms[0];

  return visualNeeds.map((visualNeed, index) => {
    const subjectRoute = inferSubjectRoute(visualNeed.anchorText);
    const matchingAssetPlan = assetPlans.find((plan) =>
      visualNeed.anchorText.toLowerCase().includes(plan.matchedAlias.toLowerCase())
    );
    const fallbackPlatformKey = topPlatform?.platformKey ?? "manual_review";
    const resolvedPlatformKey = shouldUseResolvedAssetTarget(visualNeed, matchingAssetPlan)
      ? matchingAssetPlan?.target?.platformKey
      : undefined;
    const platformKey =
      resolvedPlatformKey ??
      pickPlatformForParagraph(subjectRoute, recommendation, visualNeed.suggestedPlatforms[0] ?? fallbackPlatformKey);
    const captureKey = defaultCaptureKey(
      platformKey,
      topPlatform?.readyCaptureKeys[0] ??
      (resolvedPlatformKey ? "price_chart" : "primary_view")
    );
    const captureUrl =
      (resolvedPlatformKey ? matchingAssetPlan?.target?.url : undefined) ??
      subjectRoute?.platformUrls[platformKey] ??
      "https://example.com";
    const sourceLabel =
      resolvedPlatformKey && matchingAssetPlan?.target?.url && matchingAssetPlan.assetKey
        ? `${matchingAssetPlan.assetKey} ${platformKey}`.replace(/_/g, " ")
        : subjectRoute?.sourceLabel ?? `${platformKey} ${captureKey}`.replace(/_/g, " ");
    const sourceUrl = captureUrl;

    return {
      assetKey: matchingAssetPlan?.assetKey ?? `claim_${index + 1}`,
      platformKey,
      captureKey,
      captureUrl,
      anchorText: visualNeed.anchorText,
      rationale: buildRationale(visualNeed.anchorText),
      sourceLabel,
      sourceUrl,
      caption: generateCaption({
        siteId,
        profile: captionProfile,
        subject: sourceLabel,
        rationale: buildRationale(visualNeed.anchorText),
        sourceLabel,
        sourceUrl
      })
    };
  });
}

function topPlatformsForEvidence(
  recommendation: PlatformRecommendation,
  evidenceType: PlatformRecommendation["evidenceTypes"][number]
): string[] {
  const current = recommendation.rankedPlatforms
    .filter((platform) => platform.matchedEvidence.includes(evidenceType))
    .slice(0, 2)
    .map((platform) => platform.platformKey);
  const suggested = recommendation.suggestedAdditions
    .filter((platform) => platform.matchedEvidence.includes(evidenceType))
    .slice(0, 2)
    .map((platform) => platform.platformKey);

  return Array.from(new Set([...current, ...suggested])).slice(0, 3);
}

function defaultDataToCover(
  evidenceType: PlatformRecommendation["evidenceTypes"][number],
  title: string
): string[] {
  switch (evidenceType) {
    case "etf_flow":
      return [
        "the exact ETF, holder, or flow figure cited in the article",
        "time period and filing or reporting source",
        "whether the flow changed price or market positioning"
      ];
    case "filing_regulatory":
      return [
        "the filing, regulator, or formal source document",
        "what was actually filed or approved",
        "what remains pending or uncertain"
      ];
    case "derivatives_market":
      return [
        "the specific open interest, funding rate, or liquidation metric",
        "the relevant timeframe",
        "why that metric matters to the article thesis"
      ];
    case "exchange_positioning":
      return [
        "the exchange-specific longs or shorts metric being cited",
        "the timeframe or extreme level such as highest since a prior date",
        "why that positioning matters to the article thesis"
      ];
    case "options_market":
      return [
        "the options metric or strike cluster driving the story",
        "the expiry, strike range, or hedging setup being referenced",
        "why the options positioning changes price behavior"
      ];
    case "onchain_transfer":
      return [
        "the address or wallet activity being cited",
        "the transferred amount and destination",
        "why that movement matters for the market narrative"
      ];
    case "macro_rates":
      return [
        "the macro indicator driving the story",
        "the latest rate, yield, or policy expectation",
        "how that macro signal affects the asset in the title"
      ];
    case "commodities_fx":
      return [
        "the commodity or FX move being cited",
        "the magnitude and timeframe of the move",
        "the macro reason attached to that move"
      ];
    case "spot_market":
      return [
        `the market-price structure behind "${title}"`,
        "the key support, resistance, or downside level",
        "why price failed to respond or may reverse"
      ];
    case "equities_public_company":
      return [
        "the company disclosure or market move being cited",
        "the timeframe and magnitude",
        "why it matters to crypto or the article thesis"
      ];
    default:
      return [
        "the primary measurable claim in the article",
        "the source or metric supporting it",
        "why that evidence matters to the reader"
      ];
  }
}

function writingInstructionForEvidence(
  evidenceType: PlatformRecommendation["evidenceTypes"][number]
): string {
  switch (evidenceType) {
    case "etf_flow":
    case "filing_regulatory":
      return "Write the sourcing paragraph first, with the exact figure and formal source, before adding any image.";
    case "derivatives_market":
    case "spot_market":
      return "State the metric or chart-based thesis in the paragraph first, then insert the matching evidence image immediately after it.";
    case "exchange_positioning":
      return "State the exchange-specific positioning claim first, then add a direct Bitfinex-longs or shorts chart immediately after that paragraph.";
    case "options_market":
      return "Explain the options setup, strike level, or hedging dynamic in text first, then attach the options-market evidence image after that paragraph.";
    case "onchain_transfer":
      return "Explain what moved, where it moved, and why it matters before attaching the explorer or tracking image.";
    case "macro_rates":
    case "commodities_fx":
      return "Tie the macro move to the article thesis in text first, then place the market chart after that explanation.";
    default:
      return "Draft the claim with its sourceable data first, then attach the supporting image.";
  }
}

function buildRequiredEvidence(
  articleTitle: string,
  recommendation: PlatformRecommendation
): DraftEvidenceRequirement[] {
  return recommendation.evidenceTypes.map((evidenceType) => ({
    claim: articleTitle,
    evidenceType,
    dataToCover: defaultDataToCover(evidenceType, articleTitle),
    suggestedPlatforms: topPlatformsForEvidence(recommendation, evidenceType),
    writingInstruction: writingInstructionForEvidence(evidenceType)
  }));
}

export async function planDraftWorkflow(input: {
  articlePath: string;
  siteId?: string;
}): Promise<DraftWorkflowPlan> {
  const article = await readDraftArticle(input.articlePath);
  const assetMap = await loadAssetMap();
  const captionProfiles = await loadCaptionProfiles();
  const sitePriority = input.siteId ? await loadSitePriority() : null;
  const matches = extractAssetsFromArticle(article, assetMap);
  const assetPlans: DraftAssetPlan[] = [];
  let markdown = buildInitialMarkdown(article.title, article.markdownBody);

  const platformRecommendation = await recommendPlatformsForArticle({
    title: article.title,
    body: article.body,
    url: input.articlePath
  });
  const requiredEvidence = buildRequiredEvidence(article.title, platformRecommendation);
  const visualNeeds = buildVisualNeeds(markdown, article.title, matches, platformRecommendation);
  const captionProfile =
    (input.siteId ? captionProfiles[input.siteId] : undefined) ?? captionProfiles.coincu;

  for (const match of matches) {
    const target =
      input.siteId && sitePriority
        ? await resolveTargetsForAsset({
            siteId: input.siteId,
            assetKey: match.assetKey,
            assetMap,
            sitePriority
          })
        : null;

    assetPlans.push({
      assetKey: match.assetKey,
      matchedAlias: match.matchedAlias,
      target
    });

    if (!target) {
      continue;
    }
  }

  const capturePlans = buildCapturePlans(
    visualNeeds,
    matches,
    assetPlans,
    platformRecommendation,
    input.siteId,
    captionProfile
  );

  for (const capturePlan of capturePlans) {
    markdown = insertCaptureBlock({
      markdown,
      assetKey: capturePlan.assetKey,
      platformKey: capturePlan.platformKey,
      captureKey: capturePlan.captureKey,
      imagePath: `../images/${capturePlan.assetKey}__${capturePlan.platformKey}__${capturePlan.captureKey}.png`,
      anchorText: capturePlan.anchorText,
      rationale: capturePlan.rationale,
      sourceLabel: capturePlan.sourceLabel,
      caption: capturePlan.caption
    });
  }

  markdown = insertSectionBlock(markdown, "Required Evidence", buildRequiredEvidenceLines(requiredEvidence));
  markdown = insertSectionBlock(markdown, "Visual Needs", buildVisualNeedLines(visualNeeds));
  markdown = insertSectionBlock(markdown, "Capture Plan", buildCapturePlanLines(capturePlans));

  markdown = insertDataNotesBlock({
    markdown,
    lines: buildDataNotes(platformRecommendation, assetPlans, requiredEvidence, capturePlans)
  });

  return {
    articleTitle: article.title,
    articlePath: path.resolve(input.articlePath),
    siteId: input.siteId,
    matches,
    assetPlans,
    requiredEvidence,
    visualNeeds,
    capturePlans,
    platformRecommendation,
    markdown
  };
}
