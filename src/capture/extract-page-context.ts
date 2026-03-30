import type { Page } from "playwright";

export interface CapturePageContext {
  pageTitle: string;
  summary: string;
  dataPoints: string[];
}

const PRIORITY_PATTERNS = [
  /\bput\/call ratio\b/i,
  /\bopen interest\b/i,
  /\bimplied volatility\b/i,
  /\bcall open interest\b/i,
  /\bput open interest\b/i,
  /\btotal open interest\b/i,
  /\bnotional value\b/i,
  /\b24h\b/i,
  /\byield\b/i,
  /\brate\b/i,
  /\bvolume\b/i,
  /\bprice\b/i
];

function normalizeLines(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 8);
}

function scoreLine(line: string): number {
  let score = 0;

  if (/\d/.test(line)) {
    score += 2;
  }

  if (/%|\$|k\b|m\b|b\b/i.test(line)) {
    score += 1;
  }

  if (PRIORITY_PATTERNS.some((pattern) => pattern.test(line))) {
    score += 3;
  }

  if (line.length > 180) {
    score -= 1;
  }

  return score;
}

function shorten(line: string, maxLength = 140): string {
  if (line.length <= maxLength) {
    return line;
  }

  return `${line.slice(0, maxLength).replace(/[ ,;:.-]+$/, "")}...`;
}

function buildSummary(pageTitle: string, dataPoints: string[]): string {
  if (dataPoints.length === 0) {
    return pageTitle;
  }

  return dataPoints[0];
}

export async function extractPageContext(page: Page): Promise<CapturePageContext> {
  const pageTitle = (await page.title().catch(() => "Source page")).trim() || "Source page";
  const bodyText = await page.locator("body").innerText().catch(() => "");
  const candidates = normalizeLines(bodyText)
    .filter((line) => /\d/.test(line))
    .map((line) => ({ line, score: scoreLine(line) }))
    .filter((entry) => entry.score >= 3)
    .sort((left, right) => right.score - left.score || left.line.length - right.line.length)
    .slice(0, 3)
    .map((entry) => shorten(entry.line));

  return {
    pageTitle,
    summary: buildSummary(pageTitle, candidates),
    dataPoints: candidates
  };
}
