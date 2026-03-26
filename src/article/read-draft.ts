import { readFile } from "node:fs/promises";

import type { ArticleDraft } from "../shared/types";

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value: string): string {
  return decodeHtml(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function convertLinksToMarkdown(value: string): string {
  return value.replace(/<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_match, href, text) => {
    const cleanText = stripTags(text).replace(/\s+/g, " ").trim();
    return cleanText ? `[${cleanText}](${href})` : "";
  });
}

function convertHtmlToMarkdown(raw: string): string {
  let markdown = decodeHtml(raw)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<figure[\s\S]*?<\/figure>/gi, " ")
    .replace(/<\/?(tbody|table|tr|td)[^>]*>/gi, "")
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_match, text) => `\n\n## ${stripTags(text)}\n\n`)
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_match, text) => `\n\n### ${stripTags(text)}\n\n`)
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_match, text) => `\n\n${convertLinksToMarkdown(text)}\n\n`);

  markdown = convertLinksToMarkdown(markdown)
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return markdown;
}

function extractTitle(raw: string): string {
  const imageAlt = raw.match(/<img[^>]*alt="([^"]+)"/i)?.[1];
  if (imageAlt) {
    return stripTags(imageAlt);
  }

  const firstHeading = raw.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i)?.[1];
  if (firstHeading) {
    return stripTags(firstHeading);
  }

  return "Untitled Article";
}

export async function readDraftArticle(filePath: string): Promise<ArticleDraft> {
  const raw = await readFile(filePath, "utf8");
  const title = extractTitle(raw);
  const body = stripTags(raw);
  const markdownBody = convertHtmlToMarkdown(raw);

  return {
    sourcePath: filePath,
    title,
    body,
    markdownBody,
    raw
  };
}
