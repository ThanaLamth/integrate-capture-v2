export interface InsertCaptureInput {
  markdown: string;
  assetKey: string;
  platformKey: string;
  captureKey: string;
  imagePath: string;
  anchorText?: string;
  rationale?: string;
  sourceLabel?: string;
  caption?: string;
  contextNote?: string;
}

function buildCaptureBlock(input: InsertCaptureInput): string {
  return [
    `<!-- capture:${input.assetKey}:${input.platformKey}:${input.captureKey} -->`,
    `![${input.assetKey} ${input.captureKey}](${input.imagePath})`,
    input.caption ?? "",
    input.contextNote ? `> ${input.contextNote}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[`*_#[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function insertCaptureBlock(input: InsertCaptureInput): string {
  const block = buildCaptureBlock(input);
  const paragraphs = input.markdown.split(/\n\s*\n/);
  const assetNeedle = normalizeForMatch(input.assetKey);
  const anchorNeedle = input.anchorText ? normalizeForMatch(input.anchorText) : "";
  const anchorIndex = anchorNeedle
    ? paragraphs.findIndex((paragraph) =>
        normalizeForMatch(paragraph).includes(anchorNeedle)
      )
    : -1;
  const index =
    anchorIndex >= 0
      ? anchorIndex
      : paragraphs.findIndex((paragraph) => {
          const normalizedParagraph = normalizeForMatch(paragraph);

          if (paragraph.trim().startsWith("#")) {
            return false;
          }

          return normalizedParagraph.includes(assetNeedle);
        });

  if (index >= 0) {
    paragraphs.splice(index + 1, 0, block);
    return paragraphs.join("\n\n");
  }

  return [input.markdown.trimEnd(), "## Market Snapshot", block].join("\n\n");
}
