import type { ProcessDefinition } from "@workspaceui/api-client/src/api/types";
import { usesCustomComponent } from "../customComponentUtils";

const makeProcess = (flag?: boolean | "Y" | "N") => ({ etmetaCustomComponent: flag }) as unknown as ProcessDefinition;

describe("usesCustomComponent", () => {
  it("returns true when the flag is the boolean true", () => {
    expect(usesCustomComponent(makeProcess(true))).toBe(true);
  });

  it("returns true when the flag is the legacy 'Y' string", () => {
    expect(usesCustomComponent(makeProcess("Y"))).toBe(true);
  });

  it("returns false when the flag is the boolean false", () => {
    expect(usesCustomComponent(makeProcess(false))).toBe(false);
  });

  it("returns false when the flag is the legacy 'N' string", () => {
    expect(usesCustomComponent(makeProcess("N"))).toBe(false);
  });

  it("returns false when the flag is absent", () => {
    expect(usesCustomComponent(makeProcess())).toBe(false);
  });
});
