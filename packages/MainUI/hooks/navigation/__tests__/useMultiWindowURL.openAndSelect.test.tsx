
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

let replaceSpy: jest.Mock;

jest.mock("next/navigation", () => {
  replaceSpy = jest.fn();
  return {
    __esModule: true,
    useRouter: () => ({ replace: replaceSpy, push: jest.fn() }),
    useSearchParams: () => new URLSearchParams("")
  };
});

import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";

function Harness() {
  const { openWindowAndSelect } = useMultiWindowURL();
  return (
    <button onClick={() => openWindowAndSelect("W9", { selection: { tabId: "T10", recordId: "R77" } }) }>
      run
    </button>
  );
}

describe("useMultiWindowURL - openWindowAndSelect", () => {
  beforeEach(() => {
    replaceSpy?.mockClear();
  });

  it("opens window active and applies selected record in a single navigation", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /run/i }));

    expect(replaceSpy).toHaveBeenCalledTimes(1);
    const url = String(replaceSpy.mock.calls[0][0]);
    const qs = url.split("?")[1] || "";
    const p = new URLSearchParams(qs);

    expect(p.get("w_W9")).toBe("active");
    expect(p.get("o_W9")).toBe("1");
    expect(p.get("wi_W9")).toBe("W9");
    expect(p.get("s_W9_T10")).toBe("R77");
  });
});

