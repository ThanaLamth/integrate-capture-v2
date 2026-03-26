# Local Platform Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local CLI that reads an article draft, detects asset mentions, captures configured platform regions, and writes Markdown output plus screenshots and metadata.

**Architecture:** Use a config-driven TypeScript CLI with separate modules for article parsing, platform routing, capture execution, and local output writing. Keep platform behavior in JSON config files so new sites can be added without scattering logic through the codebase.

**Tech Stack:** Node.js, TypeScript, Playwright, Vitest, Zod, CSV parsing

---

### Task 1: Initialize Project Skeleton

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/cli/index.ts`
- Create: `src/shared/types.ts`
- Test: `tests/smoke/project-structure.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/smoke/project-structure.test.ts` with checks that the CLI entry can be imported and exposes a callable entrypoint.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/smoke/project-structure.test.ts`
Expected: FAIL because project files and imports do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create the base TypeScript project files and a minimal CLI export so the import resolves.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/smoke/project-structure.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

This workspace is not a git repo. Skip commit and record that it was not possible.

### Task 2: Add Config Schemas and Validation

**Files:**
- Create: `src/config/schema.ts`
- Create: `src/config/loaders.ts`
- Create: `configs/platforms/coinmarketcap.json`
- Create: `configs/assets/asset-map.json`
- Create: `configs/site-priority.json`
- Test: `tests/config/schema.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests asserting valid config loads successfully and missing required fields are rejected.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/config/schema.test.ts`
Expected: FAIL because schemas and config files do not exist.

- [ ] **Step 3: Write minimal implementation**

Implement Zod schemas and config loaders. Create the first valid CoinMarketCap config and stub asset/site-priority config files.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/config/schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

Skip commit because git is unavailable in this workspace.

### Task 3: Convert Site Priority CSV Into Runtime Priority Data

**Files:**
- Create: `src/config/site-priority-builder.ts`
- Modify: `configs/site-priority.json`
- Test: `tests/config/site-priority-builder.test.ts`

- [ ] **Step 1: Write the failing test**

Add a test that loads the CSV and asserts `bitcoininfonews` and `coincu` return ranked platform arrays matching the source file ordering.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/config/site-priority-builder.test.ts`
Expected: FAIL because the builder does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement CSV parsing and ordered site-priority generation using `fit_rank`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/config/site-priority-builder.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

Skip commit because git is unavailable in this workspace.

### Task 4: Implement Article Parsing and Asset Extraction

**Files:**
- Create: `src/article/read-draft.ts`
- Create: `src/article/extract-assets.ts`
- Create: `src/article/normalize.ts`
- Test: `tests/article/extract-assets.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests that read `draft article.txt`, normalize text, and detect assets by alias, including `bitcoin -> bitcoin`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/article/extract-assets.test.ts`
Expected: FAIL because article parsing and extraction logic do not exist.

- [ ] **Step 3: Write minimal implementation**

Implement text loading, title/body parsing assumptions for plain text drafts, alias normalization, and deterministic asset extraction.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/article/extract-assets.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

Skip commit because git is unavailable in this workspace.

### Task 5: Resolve Assets to Preferred Platform Targets

**Files:**
- Create: `src/router/resolve-targets.ts`
- Create: `src/router/match-platform.ts`
- Test: `tests/router/resolve-targets.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests that given `site_id=bitcoininfonews` and asset `bitcoin`, the resolver chooses the first supported configured platform and returns the expected target URL.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/router/resolve-targets.test.ts`
Expected: FAIL because resolver logic does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement resolution using site-priority order, supported platform configs, and asset-map URLs.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/router/resolve-targets.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

Skip commit because git is unavailable in this workspace.

### Task 6: Implement Output Naming and Metadata Writers

**Files:**
- Create: `src/output/file-names.ts`
- Create: `src/output/write-metadata.ts`
- Create: `src/output/write-log.ts`
- Test: `tests/output/file-names.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests that assert stable PNG and JSON names based on site, asset, platform, capture key, and timestamp.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/output/file-names.test.ts`
Expected: FAIL because output helpers do not exist.

- [ ] **Step 3: Write minimal implementation**

Implement filename formatting and metadata serialization.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/output/file-names.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

Skip commit because git is unavailable in this workspace.

### Task 7: Implement Markdown Insertion Rules

**Files:**
- Create: `src/article/insert-captures.ts`
- Create: `src/article/write-markdown.ts`
- Test: `tests/article/insert-captures.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests asserting the image block is inserted after the first asset paragraph, and falls back to `## Market Snapshot` when no paragraph matches.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/article/insert-captures.test.ts`
Expected: FAIL because insertion logic does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement stable marker blocks and Markdown output writing.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/article/insert-captures.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

Skip commit because git is unavailable in this workspace.

### Task 8: Implement Capture Engine With CoinMarketCap Example

**Files:**
- Create: `src/capture/browser.ts`
- Create: `src/capture/navigate.ts`
- Create: `src/capture/capture-region.ts`
- Create: `src/capture/crop-image.ts`
- Test: `tests/capture/coinmarketcap-config.test.ts`
- Test: `tests/capture/capture-region.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests for config-driven strategy selection and crop fallback behavior using mocked geometry data. Do not start with live network capture.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/capture/coinmarketcap-config.test.ts tests/capture/capture-region.test.ts`
Expected: FAIL because capture modules do not exist.

- [ ] **Step 3: Write minimal implementation**

Implement Playwright browser setup, viewport normalization, selector-based region capture, and crop fallback support.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/capture/coinmarketcap-config.test.ts tests/capture/capture-region.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

Skip commit because git is unavailable in this workspace.

### Task 9: Wire the End-to-End Single-Article Workflow

**Files:**
- Create: `src/batch/process-article.ts`
- Modify: `src/cli/index.ts`
- Test: `tests/integration/process-article.test.ts`

- [ ] **Step 1: Write the failing test**

Add an integration-style test that processes a local article draft in dry-run mode and asserts planned outputs, selected platform, and insertion targets.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/integration/process-article.test.ts`
Expected: FAIL because orchestration logic does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement orchestration across article parsing, target resolution, output planning, and Markdown generation. Keep live browser capture behind a flag so dry-run remains testable.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/integration/process-article.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

Skip commit because git is unavailable in this workspace.

### Task 10: Add README and Batch Entry Notes

**Files:**
- Create: `README.md`
- Modify: `src/cli/index.ts`
- Test: `tests/smoke/readme-commands.test.ts`

- [ ] **Step 1: Write the failing test**

Add a smoke test that validates documented example commands stay aligned with the CLI argument parser.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/smoke/readme-commands.test.ts`
Expected: FAIL because README and final CLI options are not complete.

- [ ] **Step 3: Write minimal implementation**

Document setup, local single-file processing, future batch processing shape, output folders, and the CoinMarketCap example.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/smoke/readme-commands.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

Skip commit because git is unavailable in this workspace.
