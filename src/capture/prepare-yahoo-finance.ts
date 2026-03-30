import type { Page } from "playwright";

export async function prepareYahooFinancePage(page: Page, url: string): Promise<void> {
  if (!/finance\.yahoo\.com/i.test(url) && !/consent\.yahoo\.com/i.test(page.url())) {
    return;
  }

  const refuseButton = page.getByRole("button", {
    name: /Refuser tout|Reject all/i
  }).first();

  if (await refuseButton.count()) {
    await refuseButton.click();
    await page.waitForLoadState("domcontentloaded").catch(() => undefined);
    await page.waitForTimeout(3000);
  }
}
