import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function writeMarkdownArticle(
  outputDir: string,
  fileName: string,
  markdown: string
): Promise<string> {
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, fileName);
  await writeFile(outputPath, markdown, "utf8");
  return outputPath;
}
