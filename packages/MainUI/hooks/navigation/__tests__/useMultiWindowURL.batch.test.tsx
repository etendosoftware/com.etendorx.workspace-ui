
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

let replaceSpy: jest.Mock;

const makeSearchParams = (query: string) => new URLSearchParams(query);

jest.mock("next/navigation", () => {
  replaceSpy = jest.fn();
  return {
    __esModule: true,
    useRouter: () => ({ replace: replaceSpy, push: jest.fn() }),
    useSearchParams: () => makeSearchParams(
      // One active window with two child tabs selected/in form mode
      [
        "w_W123=active",
        "o_W123=1",
        "wi_W123=W123",
        // child C1
        "s_W123_C1=R1",
        "tf_W123_C1=R1",
        "tm_W123_C1=form",
        // child C2
        "s_W123_C2=R2",
        "tf_W123_C2=R2",
        "tm_W123_C2=form",
      ].join("&")
    ),
  };
});

import { useMultiWindowURL } from "@/hooks/navigation/useMultiWindowURL";

function Harness() {
  const { clearChildrenSelections } = useMultiWindowURL();
  return (
    <button onClick={() => clearChildrenSelections("W123", ["C1", "C2"]) }>
      run
    </button>
  );
}

describe("useMultiWindowURL batching - clearChildrenSelections", () => {
  beforeEach(() => {
    replaceSpy?.mockClear();
  });

  it("performs a single navigation and removes child selection and tab states", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /run/i }));

    expect(replaceSpy).toHaveBeenCalledTimes(1);
    const url = String(replaceSpy.mock.calls[0][0]);
    const qs = url.split("?")[1] || "";
    const p = new URLSearchParams(qs);

    // Window stays active
    expect(p.get("w_W123")).toBe("active");
    expect(p.get("o_W123")).toBe("1");
    expect(p.get("wi_W123")).toBe("W123");

    // Child states cleared
    expect(p.get("s_W123_C1")).toBeNull();
    expect(p.get("tf_W123_C1")).toBeNull();
    expect(p.get("tm_W123_C1")).toBeNull();
    expect(p.get("s_W123_C2")).toBeNull();
    expect(p.get("tf_W123_C2")).toBeNull();
    expect(p.get("tm_W123_C2")).toBeNull();
  });
});

