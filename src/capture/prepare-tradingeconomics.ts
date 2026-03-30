import type { Page } from "playwright";

const TRADINGECONOMICS_URL = /^https:\/\/tradingeconomics\.com\/.+$/i;

export async function prepareTradingEconomicsPage(page: Page, url: string): Promise<void> {
  if (!TRADINGECONOMICS_URL.test(url)) {
    return;
  }

  await page.evaluate(() => {
    const shouldRemove = (text: string): boolean =>
      text.includes("asks for your consent") ||
      text.includes("personal data") ||
      text.includes("privacy") ||
      text.includes("vendor preferences") ||
      text.includes("data preferences");

    for (const dialog of document.querySelectorAll("[role='dialog'], .modal")) {
      const element = dialog as HTMLElement;
      const text = (element.innerText || "").toLowerCase();
      if (shouldRemove(text) || text.trim() === "close") {
        element.remove();
      }
    }

    for (const selector of [".modal-backdrop", ".overlay", "[class*='backdrop']", "[class*='consent']"]) {
      for (const node of document.querySelectorAll(selector)) {
        const element = node as HTMLElement;
        const text = (element.innerText || "").toLowerCase();
        if (!text || shouldRemove(text)) {
          element.remove();
        }
      }
    }

    document.body.style.overflow = "auto";
    document.body.style.paddingRight = "0px";
  });

  await page.waitForTimeout(1000);
}
