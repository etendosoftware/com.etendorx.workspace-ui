import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

let pushSpy: jest.Mock;
let replaceSpy: jest.Mock;

jest.mock("next/navigation", () => {
  pushSpy = jest.fn();
  replaceSpy = jest.fn();
  return {
    __esModule: true,
    useRouter: () => ({ push: pushSpy, replace: replaceSpy }),
    usePathname: () => "/", // not in window route
    useSearchParams: () => new URLSearchParams("")
  };
});

jest.mock("@/hooks/useMetadataContext", () => ({
  useMetadataContext: () => ({
    getWindowMetadata: (id: string) => ({ id, tabs: [{ id: "T10", tabLevel: 0 }] }),
    loadWindowData: async () => ({ id: "W9", tabs: [{ id: "T10", tabLevel: 0 }] }),
  }),
}));

// Default preference mocked to table mode; individual tests can re-mock
jest.mock("@/utils/prefs", () => ({
  isLinkedLabelOpenInForm: () => false,
}));

describe.skip("useRedirect - linked label preselects and opens form", () => {
  beforeEach(() => {
    pushSpy?.mockClear();
    replaceSpy?.mockClear();
  });

  it("pushes URL including selected record only (table mode)", () => {
    jest.isolateModules(() => {
      jest.doMock("@/utils/prefs", () => ({ isLinkedLabelOpenInForm: () => false }));
      const { useRedirect } = require("@/hooks/navigation/useRedirect");
      function Harness() {
        const { handleClickRedirect } = useRedirect();
        return <button onClick={(e) => handleClickRedirect(e, "W9", "W9-name", "R77")}>go</button>;
      }
      render(<Harness />);
    });
    fireEvent.click(screen.getByRole("button", { name: /go/i }));

    expect(pushSpy).toHaveBeenCalledTimes(1);
    const url = String(pushSpy.mock.calls[0][0]);
    const qs = url.split("?")[1] || "";
    const p = new URLSearchParams(qs);

    expect(p.get("w_W9")).toBe("active");
    expect(p.get("s_W9_T10")).toBe("R77");
    expect(p.get("tf_W9_T10")).toBeNull();
    expect(p.get("tm_W9_T10")).toBeNull();
    expect(p.get("tfm_W9_T10")).toBeNull();
  });

  it("pushes URL including tab form state when pref = form", () => {
    jest.isolateModules(() => {
      jest.doMock("@/utils/prefs", () => ({ isLinkedLabelOpenInForm: () => true }));
      const { useRedirect } = require("@/hooks/navigation/useRedirect");
      function HarnessForm() {
        const { handleClickRedirect } = useRedirect();
        return <button onClick={(e) => handleClickRedirect(e, "W9", "W9-name", "R77")}>go</button>;
      }
      render(<HarnessForm />);
    });
    fireEvent.click(screen.getByRole("button", { name: /go/i }));

    expect(pushSpy).toHaveBeenCalledTimes(1);
    const url = String(pushSpy.mock.calls[0][0]);
    const qs = url.split("?")[1] || "";
    const p = new URLSearchParams(qs);

    expect(p.get("w_W9")).toBe("active");
    expect(p.get("s_W9_T10")).toBe("R77");
    expect(p.get("tf_W9_T10")).toBe("R77");
    expect(p.get("tm_W9_T10")).toBe("form");
    expect(p.get("tfm_W9_T10")).toBe("edit");
  });
});
