# Local Platform Capture Design

**Date:** 2026-03-25

**Goal**

Build a local workflow that reads an article draft, detects mentioned crypto assets, selects the most appropriate data platforms for the target publishing site, captures predefined visual regions from those platform pages, and produces a Markdown article with inserted image references plus local metadata files.

## Context

The workspace contains:

- A draft article source file: `draft article.txt`
- A site-to-platform ranking file: `site_platform_fit_sorted_by_site_2026-03-25.csv`
- Supporting reference documents for platform selection

The first implementation should not update WordPress directly. Instead, it should generate local outputs that can later be uploaded or pasted into WordPress manually.

## Non-Goals

- No WordPress API integration in v1
- No automatic draft creation in WordPress
- No AI-driven freeform image placement
- No unsupported platform scraping without an explicit config

## Primary Use Case

1. Operator provides a local article draft and a target `site_id`
2. System extracts asset mentions from the article
3. System resolves preferred capture platforms using site-specific ranked platform data
4. System resolves per-platform URLs for the matched assets
5. System captures predefined regions from those URLs
6. System writes local image files, metadata, and a Markdown version of the article with inserted image blocks

## Functional Requirements

### 1. Article Input

The workflow must:

- Read a local article draft file
- Support plain text input for v1
- Produce a Markdown output file

### 2. Asset Detection

The workflow must:

- Parse the article title and body
- Normalize text for comparison
- Detect known assets using aliases
- Return deterministic matches only
- Skip ambiguous matches and log them

### 3. Site-Aware Platform Prioritization

The workflow must:

- Read `site_platform_fit_sorted_by_site_2026-03-25.csv`
- Build a ranked platform preference list per `site_id`
- Use that list to decide which platform to try first for each asset

### 4. Platform Routing

The workflow must:

- Load platform configs from `configs/platforms/*.json`
- Match a resolved target URL to a configured page type
- Support per-platform wait rules, selectors, fallback selectors, and crop rules

### 5. Capture Execution

The workflow must:

- Use a normalized viewport
- Open the resolved asset page directly
- Wait for the required content to render
- Scroll target regions into view when needed
- Prefer direct element screenshots
- Fall back to full-page screenshot plus crop when element capture is unavailable
- Retry when selectors are temporarily missing
- Save capture failures without crashing the full batch

### 6. Output Generation

For each successful capture, the workflow must produce:

- A `.png` screenshot file
- A `.json` metadata file with site, asset, URL, timestamp, page type, capture key, selector used, and success status

For each processed article, the workflow must produce:

- A Markdown article file with inserted image references

### 7. Markdown Insertion Rules

The workflow must:

- Insert each image after the first paragraph that mentions the matched asset
- Fall back to a generated `## Market Snapshot` section if no placement point is found
- Use stable HTML comment markers so reruns can replace the same inserted block

Example inserted block:

```md
<!-- capture:bitcoin:coinmarketcap:price_chart -->
![Bitcoin price chart](../images/bitcoininfonews__bitcoin__coinmarketcap__price_chart__20260325T154500.png)
```

### 8. Batch Processing

The workflow must support:

- Processing one draft file directly
- Processing a CSV/list manifest later without architectural changes

## Configuration Model

The system uses three config layers.

### 1. Platform Config

Location:

- `configs/platforms/<platform>.json`

Fields:

- `siteName`
- `platformKey`
- `matchRules`
- `viewports`
- `waitConditions`
- `captures`
- `output`

Each capture entry includes:

- `captureKey`
- `pageType`
- `strategy`
- `selectors`
- `fallbackSelectors`
- `cropRules`
- `scrollIntoView`
- `retries`

### 2. Asset Map

Location:

- `configs/assets/asset-map.json`

This maps normalized asset names and aliases to platform-specific URLs.

### 3. Site Priority

Location:

- `configs/site-priority.json`

This is generated from the CSV ranking file and maps each `site_id` to an ordered list of platforms.

## Initial Supported Platforms

The CSV indicates the first useful platform set should include:

- CoinGecko
- CoinGlass
- DefiLlama
- CoinMarketCap
- CryptoQuant
- Glassnode

The first mandatory working example is:

- CoinMarketCap coin detail page
- Capture the price chart area from the individual coin page

## CoinMarketCap Example

Expected URL format:

- `https://coinmarketcap.com/currencies/<slug>/`

Expected page type:

- `coin_detail`

Primary capture:

- `price_chart`

Execution behavior:

- Open the coin detail page, not homepage or listing page
- Wait for chart content and dynamic rendering
- Try configured chart selectors first
- Fall back to a crop anchored to `main` if the element capture fails

## Architecture

### `src/article`

Responsibilities:

- Read plain text drafts
- Split title/body
- Extract asset mentions
- Find insertion points
- Render final Markdown

### `src/router`

Responsibilities:

- Load platform configs
- Load site priorities
- Resolve asset-to-platform order
- Match URLs to page types

### `src/capture`

Responsibilities:

- Launch Playwright
- Normalize viewport
- Navigate and wait
- Find target elements
- Capture element or crop fallback
- Retry and surface detailed errors

### `src/output`

Responsibilities:

- Generate file names
- Write images
- Write metadata
- Write run logs

### `src/batch`

Responsibilities:

- Process one or many article inputs
- Aggregate failures without aborting the full run

### `src/cli`

Responsibilities:

- Parse command-line arguments
- Select input mode
- Trigger dry-run or live capture

## Error Handling

The workflow must log and continue when:

- An asset mention cannot be resolved
- A platform config is missing
- A selector is missing
- A capture fails after retries

Each failure record should include:

- article file
- asset
- platform
- target URL
- page type
- error code
- human-readable message

## Testing Strategy

### Unit Tests

- Asset alias normalization
- Site-priority loading
- Asset-to-platform resolution
- URL matching
- Markdown insertion rules
- Output naming

### Config Validation Tests

- Reject malformed platform config files
- Reject missing required capture fields

### Integration Tests

- CoinMarketCap coin detail capture path
- Dry-run processing of the draft article

## Deliverables

1. Workflow implementation
2. Clear platform config schema
3. Working CoinMarketCap example
4. Easy path for adding more platform configs
5. README for running local and batch captures

## Constraints

- The current workspace is not a git repository
- Therefore spec and plan documents can be written locally but cannot be committed from this folder

## Platform Notes

### DexScreener

- Public pair pages can be matched and routed, but live capture from this VPS is currently blocked by Cloudflare human verification.
- Treat DexScreener as requiring a Cloudflare captcha solver or a manual-assisted session before it can be used reliably in automated exports.
- Do not mark DexScreener production-ready for unattended capture until that bypass is in place.

### DappRadar

- Public dapp pages can be matched and routed, but live capture from this VPS is currently blocked by Cloudflare verification.
- Treat DappRadar as requiring a Cloudflare bypass or a manual-assisted session before it can be used reliably in automated exports.
- Do not mark DappRadar production-ready for unattended capture until that bypass is in place.

### Arkm

- Public entity pages can be matched and routed, but live capture from this VPS is currently blocked by Cloudflare verification.
- Treat Arkm as requiring a Cloudflare bypass or a manual-assisted session before it can be used reliably in automated exports.
- Do not mark Arkm production-ready for unattended capture until that bypass is in place.

### Dune

- Public collection pages can be matched and routed, but live capture from this VPS is currently blocked by Cloudflare verification.
- Treat Dune as requiring a Cloudflare bypass or a manual-assisted session before it can be used reliably in automated exports.
- Do not mark Dune production-ready for unattended capture until that bypass is in place.

### Token Insight

- Public exchange pages can be matched and routed, but live capture from this VPS is currently blocked by Cloudflare verification.
- Treat Token Insight as requiring a Cloudflare bypass or a manual-assisted session before it can be used reliably in automated exports.
- Do not mark Token Insight production-ready for unattended capture until that bypass is in place.

### CryptoSlam

- Public blockchain pages can be matched, routed, and captured from this VPS for at least the current blockchain summary/chart section.
- Login may still be required for some deeper or account-gated CryptoSlam views, so authenticated-session handling may still be needed for future expansion.
- Treat the current `blockchain_summary` capture as usable, but do not assume all CryptoSlam page types are production-ready without further verification.
