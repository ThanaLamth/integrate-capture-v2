import type { Page } from "playwright";

const COMMON_DISMISS_PATTERNS = [
  /accept/i,
  /agree/i,
  /allow/i,
  /continue/i,
  /close/i,
  /got it/i,
  /understand/i,
  /ok/i,
  /reject/i,
  /refuser/i,
  /decline/i,
  /dismiss/i,
  /not now/i,
  /skip/i
];

async function clickMatchingButtons(page: Page): Promise<void> {
  const buttons = page.locator("button, [role='button']");
  const count = Math.min(await buttons.count(), 40);

  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index);
    const text = (await button.innerText().catch(() => "")).trim();
    if (!text) {
      continue;
    }

    if (!COMMON_DISMISS_PATTERNS.some((pattern) => pattern.test(text))) {
      continue;
    }

    const box = await button.boundingBox().catch(() => null);
    if (!box) {
      continue;
    }

    try {
      await button.click({
        force: true,
        timeout: 1000
      });
      await page.waitForTimeout(500);
    } catch {
      // Ignore buttons that are not actually actionable.
    }
  }
}

async function removeBlockingLayers(page: Page): Promise<void> {
  await page.evaluate(() => {
    const selectors = [
      ".modal-backdrop",
      ".overlay",
      ".popup",
      ".cookie-banner",
      ".cookie-consent",
      "[data-testid*='consent']",
      "[id*='consent']",
      "[class*='consent']",
      "[class*='cookie']",
      "[class*='modal']",
      "[class*='overlay']"
    ];

    for (const selector of selectors) {
      for (const node of document.querySelectorAll(selector)) {
        const element = node as HTMLElement;
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        if (
          (style.position === "fixed" || style.position === "sticky") &&
          rect.width >= window.innerWidth * 0.4 &&
          rect.height >= window.innerHeight * 0.1
        ) {
          element.remove();
        }
      }
    }

    for (const dialog of document.querySelectorAll("[role='dialog']")) {
      const element = dialog as HTMLElement;
      const text = (element.innerText || "").toLowerCase();
      if (
        text.includes("consent") ||
        text.includes("cookie") ||
        text.includes("privacy") ||
        text.includes("personal data")
      ) {
        element.remove();
      }
    }

    document.body.style.overflow = "auto";
    document.body.style.paddingRight = "0px";
  });
}

export async function prepareGenericPage(page: Page): Promise<void> {
  await clickMatchingButtons(page).catch(() => undefined);
  await removeBlockingLayers(page).catch(() => undefined);
  await page.waitForTimeout(500);
}
