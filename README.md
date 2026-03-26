# Local Platform Capture

Local workflow for turning an article draft into a Markdown article with market-data image placeholders generated from site-aware platform capture rules.

## What This Repo Does

- Reads a local draft article file
- Detects asset mentions from the title and body
- Uses site-specific platform priority from `site_platform_fit_sorted_by_site_2026-03-25.csv`
- Resolves asset URLs through config
- Applies platform-specific capture rules and site-specific page prep
- Produces Markdown output with inserted image references
- Writes screenshot metadata and logs locally

## Current Scope

- Local files only
- No WordPress integration in this repo
- Designed to be called by a separate article-writing flow
- Uses Playwright-based browser capture
- Supports per-platform selectors, crop fallbacks, and pre-capture interactions

## Supported Workflow

This repo is best treated as a small capture module for another machine or another article bot.

The caller provides:

- `platformKey`
- `url`
- `captureKey`
- `outputPath`

The capture layer returns:

- `outputPath`
- `selectorUsed`
- `mode`

## Install

```bash
npm install
npx playwright install
```

## Build And Test

```bash
npm run build
npm test
```

## Run The Article Flow

Dry run:

```bash
npm run build
node dist/src/cli/main.js --article "draft article.txt" --site bitcoininfonews --dry-run
```

Live run:

```bash
npm run build
node dist/src/cli/main.js --article "draft article.txt" --site coincu
```

## Programmatic Capture Example

```js
const { executeCapture } = require("./dist/src/capture/execute-capture.js");

const result = await executeCapture({
  platformKey: "coingecko",
  url: "https://www.coingecko.com/en/coins/bitcoin",
  captureKey: "price_chart",
  outputPath: "./output/images/bitcoin-coingecko.png"
});

console.log(result);
```

## Output Layout

- `output/images/`
- `output/metadata/`
- `output/articles/`
- `output/logs/`

## Config Layout

- `configs/platforms/*.json`
- `configs/assets/asset-map.json`
- `configs/site-priority.json`

## Platform Status Notes

Machine-readable platform access notes are in:

- `docs/platform-access-status-2026-03-26.csv`

This file records whether a platform currently works from this VPS, is login-gated, or is blocked by Cloudflare/captcha.

Broader design notes and capture observations are in:

- `docs/superpowers/specs/2026-03-25-local-platform-capture-design.md`

## GitHub Export

Recommended structure:

- create a dedicated GitHub repo for this project
- push source, configs, tests, and docs
- do not push generated output, browser state, or local-only artifacts

This repo is prepared to exclude:

- `node_modules/`
- `dist/`
- `output/`
- Playwright reports and test artifacts
- local env files

## Typical Setup On Another PC

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd integrate-data-image
npm install
npx playwright install
npm run build
npm test
```

Then integrate it into the article-writing machine by either:

1. calling the CLI
2. importing `executeCapture(...)` from `dist/src/capture/execute-capture.js`

## Suggested GitHub Commands

Initialize locally:

```bash
git init
git add .
git commit -m "Initial local platform capture export"
```

Attach GitHub remote and push:

```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
git branch -M main
git push -u origin main
```

## Notes For The Other PC

- Some platforms are fully usable from this VPS and should transfer cleanly
- Some platforms are blocked by Cloudflare and may still require a captcha solver or a manual-assisted browser session
- Some platforms may require login for deeper pages even if one public page already works

Always check `docs/platform-access-status-2026-03-26.csv` before wiring a platform into unattended article export.
