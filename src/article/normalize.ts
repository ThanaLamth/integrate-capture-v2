export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&nbsp;/g, " ")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
