import { describe, expect, it } from "vitest";

import { runCli } from "../../src/cli/index";

describe("project structure", () => {
  it("exports a callable CLI entrypoint", () => {
    expect(typeof runCli).toBe("function");
  });
});
