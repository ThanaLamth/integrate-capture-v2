export interface AppContext {
  cwd: string;
}

export interface ArticleDraft {
  sourcePath: string;
  title: string;
  body: string;
  markdownBody: string;
  raw: string;
}

export interface AssetMatch {
  assetKey: string;
  matchedAlias: string;
}
