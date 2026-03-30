import type { EvidenceType } from "../config/schema";

export interface ArticleRoutingInput {
  title: string;
  body?: string;
  url?: string;
}

export interface ArticleClassification {
  evidenceTypes: EvidenceType[];
  matchedSignals: string[];
}

interface Rule {
  evidenceType: EvidenceType;
  signals: string[];
  patterns: RegExp[];
  blockers?: RegExp[];
}

const RULES: Rule[] = [
  {
    evidenceType: "onchain_transfer",
    signals: ["whale", "transfer", "wallet", "address", "withdraw", "deposit", "on-chain"],
    patterns: [
      /\bwhale\b/i,
      /\btransfer\b/i,
      /\bwallet\b/i,
      /\baddress\b/i,
      /\bwithdra(?:w|ws|wal)\b/i,
      /\bdeposit\b/i,
      /\bon-?chain\b/i
    ]
  },
  {
    evidenceType: "derivatives_market",
    signals: ["open interest", "funding rate", "liquidation", "short position", "long liquidation", "derivatives"],
    patterns: [
      /\bopen interest\b/i,
      /\bfunding rate\b/i,
      /\bliquidation/i,
      /\bshort position\b/i,
      /\blong liquidation\b/i,
      /\bderivatives?\b/i
    ]
  },
  {
    evidenceType: "exchange_positioning",
    signals: [
      "bitfinex longs",
      "bitfinex shorts",
      "long positions",
      "short positions",
      "highest since"
    ],
    patterns: [
      /\bbitfinex longs?\b/i,
      /\bbitfinex shorts?\b/i,
      /\blong positions?\b/i,
      /\bshort positions?\b/i,
      /\bhighest since\b/i
    ]
  },
  {
    evidenceType: "options_market",
    signals: [
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
    patterns: [
      /\boptions?\b/i,
      /\bput-?options?\b/i,
      /\bcall-?options?\b/i,
      /\bstrikes?\b/i,
      /\bmax pain\b/i,
      /\bimplied volatility\b/i,
      /\bgamma\b/i,
      /\bhedging\b/i,
      /\bmarket makers?\b/i
    ]
  },
  {
    evidenceType: "defi_metrics",
    signals: ["defi", "tvl", "stablecoin", "protocol", "staking", "perps"],
    patterns: [
      /\bdefi\b/i,
      /\btvl\b/i,
      /\bstablecoin\b/i,
      /\bprotocol\b/i,
      /\bstaking\b/i,
      /\bperps?\b/i
    ],
    blockers: [/\bbill\b/i, /\bpolicy\b/i, /\btargets\b/i]
  },
  {
    evidenceType: "spot_market",
    signals: ["bitcoin", "ethereum", "xrp", "solana", "price target", "market sentiment"],
    patterns: [
      /\bbitcoin\b/i,
      /\bethereum\b/i,
      /\bxrp\b/i,
      /\bsolana\b/i,
      /\bprice target\b/i,
      /\bmarket sentiment\b/i
    ]
  },
  {
    evidenceType: "etf_flow",
    signals: ["etf", "inflow", "outflow", "etp"],
    patterns: [/\betf\b/i, /\binflows?\b/i, /\boutflows?\b/i, /\betps?\b/i],
    blockers: [/\bgold\b/i, /\byields?\b/i, /\bdollar\b/i, /\bbrent\b/i, /\bnatural gas\b/i]
  },
  {
    evidenceType: "structured_product",
    signals: ["leveraged etf", "2x", "structured product", "private company", "spacex", "anthropic"],
    patterns: [
      /\bleveraged etf\b/i,
      /\b2x\b/i,
      /\bstructured product\b/i,
      /\bprivate compan(?:y|ies)\b/i,
      /\bspacex\b/i,
      /\banthropic\b/i
    ]
  },
  {
    evidenceType: "filing_regulatory",
    signals: ["sec", "files", "filing", "bureau", "cftc", "mas"],
    patterns: [/\bsec\b/i, /\bfil(?:e|es|ing)\b/i, /\bbureau\b/i, /\bcftc\b/i, /\bmas\b/i]
  },
  {
    evidenceType: "policy_regulatory",
    signals: ["bill", "fdic", "policy", "federal reserve", "bank of england", "pboc", "powell", "sep", "fomc"],
    patterns: [
      /\bbill\b/i,
      /\bfdic\b/i,
      /\bpolicy\b/i,
      /\bfederal reserve\b/i,
      /\bbank of england\b/i,
      /\bpboc\b/i,
      /\bpowell\b/i,
      /\bsep\b/i,
      /\bfomc\b/i
    ]
  },
  {
    evidenceType: "macro_rates",
    signals: ["fed", "ecb", "boe", "snb", "rate cut", "rate hold", "fedwatch", "sofr", "treasury", "yield", "federal reserve", "bank of england", "pboc", "powell", "rate hike", "dot plot", "jobless claims", "federal funds rate", "pmi", "survey"],
    patterns: [
      /\bfed\b/i,
      /\becb\b/i,
      /\bboe\b/i,
      /\bsnb\b/i,
      /\brate cuts?\b/i,
      /\brate hold\b/i,
      /\bfedwatch\b/i,
      /\bsofr\b/i,
      /\btreasur(?:y|ies)\b/i,
      /\byields?\b/i,
      /\bfederal reserve\b/i,
      /\bbank of england\b/i,
      /\bpboc\b/i,
      /\bpowell\b/i,
      /\brate-?hike\b/i,
      /\bdot plot\b/i,
      /\bjobless claims\b/i,
      /\bfederal funds rate\b/i,
      /\bpmi\b/i,
      /\bsurveys?\b/i
    ]
  },
  {
    evidenceType: "commodities_fx",
    signals: ["gold", "oil", "brent", "lng", "natural gas", "eur/usd", "dollar"],
    patterns: [
      /\bgold\b/i,
      /\boil\b/i,
      /\bbrent\b/i,
      /\blng\b/i,
      /\bnatural gas\b/i,
      /\beur\/usd\b/i,
      /\bdollar\b/i
    ]
  },
  {
    evidenceType: "equities_public_company",
    signals: ["stock", "shares", "premarket", "buyback", "market cap", "earnings", "revenue", "guidance", "demand", "delays", "liable", "outlook"],
    patterns: [
      /\bstocks?\b/i,
      /\bshares?\b/i,
      /\bpremarket\b/i,
      /\bbuyback\b/i,
      /\bmarket cap\b/i,
      /\bearnings?\b/i,
      /\brevenue\b/i,
      /\bguidance\b/i,
      /\bdemand\b/i,
      /\bdelays?\b/i,
      /\bliable\b/i,
      /\boutlook\b/i
    ]
  },
  {
    evidenceType: "ai_company_news",
    signals: ["ai", "openai", "copilot", "alexa", "deepseek", "compute", "employees", "windows", "mac"],
    patterns: [
      /\bai\b/i,
      /\bopenai\b/i,
      /\bcopilot\b/i,
      /\balexa\b/i,
      /\bdeepseek\b/i,
      /\bcompute\b/i,
      /\bemployees?\b/i,
      /\bwindows\b/i,
      /\bmac\b/i
    ]
  },
  {
    evidenceType: "funding_mna",
    signals: ["funding round", "acquires", "acquisition", "deal", "investment", "ipo", "fund", "sells"],
    patterns: [
      /\bfunding round\b/i,
      /\bacquires?\b/i,
      /\bacquisition\b/i,
      /\bdeal\b/i,
      /\binvestment\b/i,
      /\bipo\b/i,
      /\bfund\b/i,
      /\bsells?\b/i
    ],
    blockers: [/\bgold\b/i, /\byields?\b/i, /\bdollar\b/i, /\breal yields?\b/i]
  },
  {
    evidenceType: "governance",
    signals: ["dao", "proposal", "vote", "oversight", "ceo search"],
    patterns: [/\bdao\b/i, /\bproposal\b/i, /\bvote\b/i, /\boversight\b/i, /\bceo search\b/i]
  },
  {
    evidenceType: "claim_check",
    signals: ["claim checked", "claim assessed", "reviewed", "probe", "checked", "assessed", "review", "pushback"],
    patterns: [
      /\bclaim checked\b/i,
      /\bclaim assessed\b/i,
      /\breviewed\b/i,
      /\bprobe\b/i,
      /\bchecked\b/i,
      /\bassessed\b/i,
      /\breview\b/i,
      /\bpushback\b/i
    ]
  },
  {
    evidenceType: "geopolitics_security",
    signals: ["dod", "idf", "irib", "centcom", "iran", "israel", "iraq", "nato", "regional risks"],
    patterns: [
      /\bdod\b/i,
      /\bidf\b/i,
      /\birib\b/i,
      /\bcentcom\b/i,
      /\biran\b/i,
      /\bisrael\b/i,
      /\biraq\b/i,
      /\bnato\b/i,
      /\bregional risks?\b/i
    ]
  },
  {
    evidenceType: "protocol_technical",
    signals: ["bip", "pqc", "quantum", "ietf draft", "technical proposal"],
    patterns: [/\bbip-?\d+\b/i, /\bpqc\b/i, /\bquantum\b/i, /\bietf draft\b/i, /\btechnical proposal\b/i]
  },
  {
    evidenceType: "airdrop_sybil",
    signals: ["airdrop", "sybil", "fake ads"],
    patterns: [/\bairdrop\b/i, /\bsybil\b/i, /\bfake ads?\b/i]
  },
  {
    evidenceType: "token_holder_concentration",
    signals: ["holder concentration", "nav premium", "premium", "concentration"],
    patterns: [/\bholder concentration\b/i, /\bnav premium\b/i, /\bpremium\b/i, /\bconcentration\b/i]
  },
  {
    evidenceType: "index_product",
    signals: ["index perps", "index", "mag 7", "basket"],
    patterns: [/\bindex perps?\b/i, /\bindex\b/i, /\bmag 7\b/i, /\bbasket\b/i]
  },
  {
    evidenceType: "legal_security",
    signals: ["phishing", "hack", "doj", "lawsuit", "case", "scrutiny", "warning", "scam", "liable", "legal risk"],
    patterns: [
      /\bphishing\b/i,
      /\bhack\b/i,
      /\bdoj\b/i,
      /\blawsuit\b/i,
      /\bcases?\b/i,
      /\bscrutiny\b/i,
      /\bwarning\b/i,
      /\bscam\b/i,
      /\bliable\b/i,
      /\blegal risk\b/i
    ]
  }
];

function normalizeParts(input: ArticleRoutingInput): string {
  return [input.title, input.url ?? "", input.body ?? ""].join("\n").toLowerCase();
}

export function classifyArticle(input: ArticleRoutingInput): ArticleClassification {
  const haystack = normalizeParts(input);
  const evidenceTypes = new Set<EvidenceType>();
  const matchedSignals = new Set<string>();

  for (const rule of RULES) {
    const blocked = rule.blockers?.some((pattern) => pattern.test(haystack)) ?? false;
    if (blocked) {
      continue;
    }

    const matchedSignalsForRule = rule.signals.filter((signal, index) =>
      rule.patterns[index]?.test(haystack)
    );

    if (matchedSignalsForRule.length > 0) {
      evidenceTypes.add(rule.evidenceType);
      for (const signal of matchedSignalsForRule) {
        matchedSignals.add(signal);
      }
    }
  }

  if (evidenceTypes.size === 0) {
    evidenceTypes.add("general_news");
  }

  return {
    evidenceTypes: Array.from(evidenceTypes),
    matchedSignals: Array.from(matchedSignals)
  };
}
