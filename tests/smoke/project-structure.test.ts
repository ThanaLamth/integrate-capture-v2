import { describe, expect, it } from "vitest";
import { access } from "node:fs/promises";
import path from "node:path";

import { runCli } from "../../src/cli/index";

describe("project structure", () => {
  it("exports a callable CLI entrypoint", () => {
    expect(typeof runCli).toBe("function");
  });

  it("includes the PowerShell direct capture wrapper", async () => {
    await expect(
      access(path.join(process.cwd(), "capture-image.ps1"))
    ).resolves.toBeUndefined();
  });
});
