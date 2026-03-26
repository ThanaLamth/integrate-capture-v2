import type { Page } from "playwright";

const SANTIMENT_CHART_URL =
  /^https:\/\/app\.santiment\.net\/charts\/social-dominance-bitcoin-23193\/?$/i;

export async function prepareSantimentPage(page: Page, url: string): Promise<void> {
  if (!SANTIMENT_CHART_URL.test(url)) {
    return;
  }

  const voteDialogCloseButton = page
    .locator("//div[@role='dialog'][contains(.,'Vote for Santiment!')]//button")
    .first();
  try {
    await voteDialogCloseButton.waitFor({
      state: "visible",
      timeout: 5000
    });
    await voteDialogCloseButton.click();
  } catch {
    // Vote dialog did not appear.
  }

  const betaDialogCloseButton = page
    .locator("//div[@role='dialog'][contains(.,'New Charts beta is open!')]//button")
    .first();
  try {
    await betaDialogCloseButton.waitFor({
      state: "visible",
      timeout: 5000
    });
    await betaDialogCloseButton.click();
  } catch {
    // Beta dialog did not appear.
  }

  await page.evaluate(() => {
    const removeBlockingUi = () => {
      const dialogTexts = ["Vote for Santiment!", "New Charts beta is open!"];
      for (const dialogText of dialogTexts) {
        const dialog = Array.from(document.querySelectorAll("[role='dialog']")).find((element) =>
          (element.textContent || "").includes(dialogText)
        );
        dialog?.remove();
      }

      for (const dialog of document.querySelectorAll("[role='dialog']")) {
        dialog.remove();
      }

      for (const overlay of document.querySelectorAll("[data-melt-dialog-overlay]")) {
        overlay.remove();
      }

      for (const portal of document.querySelectorAll("[data-melt-dialog-portalled]")) {
        portal.remove();
      }

      document.getElementById("intercom-container")?.remove();
      for (const element of document.querySelectorAll("[class*='intercom'], .intercom-namespace")) {
        element.remove();
      }
      for (const iframe of document.querySelectorAll("iframe")) {
        const iframeElement = iframe as HTMLIFrameElement;
        if (
          iframeElement.id === "intercom-frame" ||
          (iframeElement.className || "").includes("intercom")
        ) {
          iframeElement.remove();
        }
      }

      for (const svg of document.querySelectorAll("svg")) {
        const svgElement = svg as SVGElement;
        const style = window.getComputedStyle(svgElement);
        const rect = svgElement.getBoundingClientRect();
        if (
          Number.parseFloat(style.opacity || "1") < 1 &&
          rect.width >= window.innerWidth * 0.9 &&
          rect.height >= window.innerHeight * 0.9
        ) {
          svgElement.remove();
        }
      }

      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "0px";
    };

    removeBlockingUi();
  });

  const allowAllButton = page.getByRole("button", {
    name: "Allow all"
  });
  try {
    await allowAllButton.waitFor({
      state: "visible",
      timeout: 5000
    });
    await allowAllButton.click();
  } catch {
    // Cookie prompt did not appear.
  }

  const hideProMetricsButton = page.getByRole("button", {
    name: "Hide Pro Metrics"
  });
  await hideProMetricsButton.waitFor({
    state: "visible",
    timeout: 15000
  });
  await hideProMetricsButton.click({ force: true });

  const chartContainer = page.locator("div.widget.column.svelte-veo1tu");
  await chartContainer.waitFor({
    state: "visible",
    timeout: 15000
  });

  await page.evaluate(() => {
    for (const dialog of document.querySelectorAll("[role='dialog']")) {
      dialog.remove();
    }
    for (const overlay of document.querySelectorAll("[data-melt-dialog-overlay]")) {
      overlay.remove();
    }
    document.getElementById("intercom-container")?.remove();
    for (const element of document.querySelectorAll("[class*='intercom'], .intercom-namespace")) {
      element.remove();
    }
    for (const svg of document.querySelectorAll("svg")) {
      const svgElement = svg as SVGElement;
      const style = window.getComputedStyle(svgElement);
      const rect = svgElement.getBoundingClientRect();
      if (
        Number.parseFloat(style.opacity || "1") < 1 &&
        rect.width >= window.innerWidth * 0.9 &&
        rect.height >= window.innerHeight * 0.9
      ) {
        svgElement.remove();
      }
    }
    document.body.style.overflow = "auto";
    document.body.style.paddingRight = "0px";
  });

  await page.waitForTimeout(3000);
}
