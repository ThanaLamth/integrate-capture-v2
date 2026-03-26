import type { PlatformConfig } from "../config/schema";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CaptureModeInput {
  strategy: "element" | "crop" | "element_or_crop";
  primarySelectorFound: boolean;
}

export function selectCaptureDefinition(
  config: PlatformConfig,
  pageType: string,
  captureKey: string
) {
  const capture = config.captures.find(
    (entry: PlatformConfig["captures"][number]) =>
      entry.pageType === pageType && entry.captureKey === captureKey
  );

  if (!capture) {
    throw new Error(`No capture definition for ${config.platformKey}:${pageType}:${captureKey}`);
  }

  return capture;
}

export function decideCaptureMode(input: CaptureModeInput): "element" | "crop" {
  if (input.strategy === "element") {
    return "element";
  }

  if (input.strategy === "crop") {
    return "crop";
  }

  return input.primarySelectorFound ? "element" : "crop";
}

export function buildCropRegion(
  anchorBox: BoundingBox,
  cropRules: {
    anchorSelector: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }
): BoundingBox {
  return {
    x: anchorBox.x + cropRules.x,
    y: anchorBox.y + cropRules.y,
    width: cropRules.width,
    height: cropRules.height
  };
}
