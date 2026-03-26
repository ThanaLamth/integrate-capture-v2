export interface InsertCaptureInput {
  markdown: string;
  assetKey: string;
  platformKey: string;
  captureKey: string;
  imagePath: string;
}

function buildCaptureBlock(input: InsertCaptureInput): string {
  return [
    `<!-- capture:${input.assetKey}:${input.platformKey}:${input.captureKey} -->`,
    `![${input.assetKey} ${input.captureKey}](${input.imagePath})`
  ].join("\n");
}

export function insertCaptureBlock(input: InsertCaptureInput): string {
  const block = buildCaptureBlock(input);
  const paragraphs = input.markdown.split(/\n\s*\n/);
  const assetNeedle = input.assetKey.toLowerCase();
  const index = paragraphs.findIndex((paragraph) =>
    paragraph.toLowerCase().includes(assetNeedle)
  );

  if (index >= 0) {
    paragraphs.splice(index + 1, 0, block);
    return paragraphs.join("\n\n");
  }

  return [input.markdown.trimEnd(), "## Market Snapshot", block].join("\n\n");
}
