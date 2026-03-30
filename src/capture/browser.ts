import { mkdir } from "node:fs/promises";

import type { Browser, BrowserContext, Page } from "playwright";

export interface BrowserLaunchOptions {
  headless?: boolean;
  profileDir?: string;
  userAgent?: string;
}

export interface BrowserSession {
  browser?: Browser;
  context: BrowserContext;
  page: Page;
  close(): Promise<void>;
}

export async function launchBrowserSession(
  options: BrowserLaunchOptions = {}
): Promise<BrowserSession> {
  const playwright = await import("playwright");

  if (options.profileDir) {
    await mkdir(options.profileDir, { recursive: true });
    const context = await playwright.chromium.launchPersistentContext(options.profileDir, {
      headless: options.headless ?? true,
      userAgent: options.userAgent
    });
    const page = context.pages()[0] ?? (await context.newPage());

    return {
      context,
      page,
      close: async () => {
        await context.close();
      }
    };
  }

  const browser = await playwright.chromium.launch({
    headless: options.headless ?? true
  });
  const context = await browser.newContext({
    userAgent: options.userAgent
  });
  const page = await context.newPage();

  return {
    browser,
    context,
    page,
    close: async () => {
      await context.close();
      await browser.close();
    }
  };
}

export async function warmPersistentSession(
  url: string,
  options: BrowserLaunchOptions = {}
): Promise<void> {
  if (!options.profileDir) {
    throw new Error("Persistent warmup requires a profileDir");
  }

  const session = await launchBrowserSession({
    ...options,
    headless: false
  });

  const shutdown = async () => {
    await session.close();
    process.exit(0);
  };

  process.once("SIGINT", () => {
    void shutdown();
  });
  process.once("SIGTERM", () => {
    void shutdown();
  });

  await session.page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  console.log(`Opened ${url}`);
  console.log(`Using persistent profile: ${options.profileDir}`);
  console.log("Solve the verification in the browser, then press Ctrl+C to save and exit.");

  await new Promise(() => undefined);
}
