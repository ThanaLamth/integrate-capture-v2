import type { AssetMap } from "../config/schema";
import type { ArticleDraft, AssetMatch } from "../shared/types";
import { normalizeText } from "./normalize";

export function extractAssetsFromArticle(
  article: ArticleDraft,
  assetMap: AssetMap
): AssetMatch[] {
  const haystack = ` ${normalizeText(article.title)} ${normalizeText(article.body)} `;
  const matches: AssetMatch[] = [];

  for (const [assetKey, config] of Object.entries(assetMap)) {
    const alias = config.aliases.find((candidate: string) => {
      const normalized = normalizeText(candidate);
      return haystack.includes(` ${normalized} `);
    });

    if (alias) {
      matches.push({
        assetKey,
        matchedAlias: alias
      });
    }
  }

  return matches;
}
