export interface InsertDataNotesInput {
  markdown: string;
  lines: string[];
}

export function insertDataNotesBlock(input: InsertDataNotesInput): string {
  if (input.lines.length === 0) {
    return input.markdown;
  }

  const block = ["## Data Notes", "", ...input.lines.map((line) => `- ${line}`)].join("\n");
  return [input.markdown.trimEnd(), "", block].join("\n");
}
