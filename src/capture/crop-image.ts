import type { BoundingBox } from "./capture-region";

export function validateCropRegion(region: BoundingBox): BoundingBox {
  if (region.width <= 0 || region.height <= 0) {
    throw new Error("Crop region must have positive width and height.");
  }

  return region;
}
