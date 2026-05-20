import { describe, expect, it } from "vitest";

import {
  continuumCorePackageName,
  describeContinuumCorePackage,
} from "./index";

describe("continuum core package scaffold", () => {
  it("exports from the public entrypoint", () => {
    expect(continuumCorePackageName).toBe("@continuum/core");
    expect(describeContinuumCorePackage()).toEqual({
      name: "@continuum/core",
    });
  });
});
