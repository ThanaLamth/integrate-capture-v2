import type { Browser } from "playwright";

export interface BrowserLaunchOptions {
  headless?: boolean;
}

export async function launchBrowser(options: BrowserLaunchOptions = {}): Promise<Browser> {
  const playwright = await import("playwright");
  return playwright.chromium.launch({
    headless: options.headless ?? true
  });
}
