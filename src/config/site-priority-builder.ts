import { readFile } from "node:fs/promises";

import { sitePrioritySchema, type SitePriority } from "./schema";

interface CsvRow {
  site_id: string;
  fit_rank: string;
  platform: string;
}

function normalizePlatformKey(platform: string): string {
  return platform.trim().toLowerCase().replace(/\s+/g, "");
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const nextChar = line[index + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  const [headerLine, ...dataLines] = lines;
  const headers = parseCsvLine(headerLine);

  return dataLines.map((line) => {
    const columns = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, columns[index] ?? ""]));

    return row as unknown as CsvRow;
  });
}

export async function buildSitePriorityFromCsv(csvPath: string): Promise<SitePriority> {
  const content = await readFile(csvPath, "utf8");
  const rows = parseCsv(content);
  const grouped = new Map<string, Array<{ rank: number; platform: string }>>();

  for (const row of rows) {
    const siteId = row.site_id.trim();
    const rank = Number.parseInt(row.fit_rank, 10);
    const platform = normalizePlatformKey(row.platform);

    if (!siteId || Number.isNaN(rank) || !platform) {
      continue;
    }

    const current = grouped.get(siteId) ?? [];
    current.push({ rank, platform });
    grouped.set(siteId, current);
  }

  const priority = Object.fromEntries(
    Array.from(grouped.entries()).map(([siteId, entries]) => [
      siteId,
      entries
        .sort((left, right) => left.rank - right.rank)
        .map((entry) => entry.platform)
    ])
  );

  return sitePrioritySchema.parse(priority);
}
