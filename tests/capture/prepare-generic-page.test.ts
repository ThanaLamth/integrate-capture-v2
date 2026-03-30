import { describe, expect, it, vi } from "vitest";

import { prepareGenericPage } from "../../src/capture/prepare-generic-page";

describe("prepareGenericPage", () => {
  it("tries to click common dismiss buttons and remove overlays", async () => {
    const click = vi.fn().mockResolvedValue(undefined);
    const boundingBox = vi.fn().mockResolvedValue({ x: 0, y: 0, width: 100, height: 40 });
    const innerText = vi
      .fn()
      .mockResolvedValueOnce("Accept all")
      .mockResolvedValueOnce("Read more");
    const nth = vi.fn((index: number) => ({
      innerText: innerText,
      boundingBox,
      click: index === 0 ? click : vi.fn()
    }));
    const locator = vi.fn().mockReturnValue({
      count: vi.fn().mockResolvedValue(2),
      nth
    });
    const evaluate = vi.fn().mockResolvedValue(undefined);
    const waitForTimeout = vi.fn().mockResolvedValue(undefined);

    await prepareGenericPage({
      locator,
      evaluate,
      waitForTimeout
    } as never);

    expect(locator).toHaveBeenCalledWith("button, [role='button']");
    expect(click).toHaveBeenCalledOnce();
    expect(evaluate).toHaveBeenCalledOnce();
  });
});
