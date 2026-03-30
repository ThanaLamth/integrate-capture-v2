# integrate-capture-v2

This document summarizes what changed compared with:

- `https://github.com/ThanaLamth/integreate-capture`

It also gives the setup steps to make another machine behave like the current Ubuntu `thana1` environment.

## What Changed

The original repo was mainly:

- direct Playwright capture from fixed platform configs
- asset-to-platform mapping
- basic article processing with inserted image references

This repo version adds a broader evidence-routing layer.

### Major Improvements

- Persistent browser profiles for blocked sites
  - supports warmup sessions and reuse of saved browser state
  - important for CoinGecko and other challenge-heavy platforms

- Article-aware platform recommendation
  - reads title/body signals
  - recommends platforms by evidence type instead of only fixed asset targets

- New evidence taxonomy
  - examples:
    - `macro_rates`
    - `commodities_fx`
    - `etf_flow`
    - `structured_product`
    - `options_market`
    - `exchange_positioning`
    - `policy_regulatory`
    - `claim_check`
    - `ai_company_news`

- Draft planning workflow
  - `Required Evidence`
  - `Visual Needs`
  - `Capture Plan`
  - `Data Notes`

- Platform health checks
  - tracks `healthy`, `blocked`, `broken`, `unknown`
  - stores per-platform health state in `data/platform-health-status.json`

- Selector-level capturability checks
  - verifies actual capture selectors
  - avoids false positives where a page loads but the target chart does not

- Generic popup and consent handling
  - shared dismiss pass before capture
  - plus site-specific prep hooks where needed

- Page validation before screenshot
  - rejects pages that only contain:
    - block pages
    - consent overlays
    - generic shells
    - useless body captures

- New and onboarded platforms
  - `sec-edgar`
  - `yahoo-finance`
  - `tradingeconomics`
  - `deribit`
  - `cme-fedwatch`

- Smarter subject routing
  - can switch to:
    - oil
    - gold
    - jobless claims
    - Bitfinex longs
    - ETF flow pages
  - instead of defaulting to BTC price charts

- Per-site caption profiles
  - `13` site-specific caption styles
  - concise source-led captions instead of one generic caption voice

- Capture context extraction
  - stores short page context and data points with the capture result

- Exported writing skills
  - `exported-skills/writing-consultant`
  - `exported-skills/writing-qc`

## Current Workflow Shape

The repo is now closer to:

1. read article or draft
2. classify the evidence type
3. infer the real subject
4. recommend source/platform
5. decide whether capture is required, optional, or link-only
6. validate the target page
7. capture a real chart/data block
8. generate caption and context

Instead of:

1. pick fixed platform
2. screenshot whatever loads

## Known Limits

- some sources are still blocked on this VPS by Cloudflare
- live article extraction is still fragile on some site templates
- some article families still need additional routing rules
- the repo should be treated as the capture/evidence engine
  - not the full writing-QC system

## Install On Another PC

Clone the repo:

```bash
git clone https://github.com/ThanaLamth/integrate-capture-v2.git
cd integrate-capture-v2
```

Install dependencies:

```bash
npm install
npx playwright install
npm run build
```

## Useful Commands

Draft planning:

```bash
node dist/src/cli/main.js --plan-draft --article "/path/to/draft.html" --site coincu
```

Platform recommendation only:

```bash
node dist/src/cli/main.js --recommend-title "Gold falls as real yields rise" --recommend-url "https://example.com/article"
```

Health checks:

```bash
node dist/src/cli/main.js --check-platform-health
node dist/src/cli/main.js --check-platform-health --health-platform tradingeconomics
```

Direct capture:

```bash
node dist/src/cli/main.js \
  --platform tradingview \
  --url "https://www.tradingview.com/chart/?symbol=BITSTAMP%3ABTCUSD" \
  --capture advanced_chart \
  --output "./output/images/btcusd.png"
```

Persistent session warmup:

```bash
node dist/src/cli/main.js \
  --url "https://www.coingecko.com/en/coins/bitcoin" \
  --profile-dir "./.profiles/coingecko" \
  --warmup
```

## Optional Skill Setup

If the other machine also needs the exported writing skills, copy:

- `exported-skills/writing-consultant`
- `exported-skills/writing-qc`

into:

- `~/.codex/skills/`

If you use the same knowledge-base-based setup as this Ubuntu machine, also copy the writing knowledge base and update the reference paths in:

- `references/consulting-map.md`
- `references/qc-map.md`

## Recommended Use

Use this repo as:

- capture engine
- evidence router
- platform validator
- caption/context generator

Keep writing QC and editorial judgment separate if you already run those on another machine.
