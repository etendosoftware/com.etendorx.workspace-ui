import { render, waitFor } from "@testing-library/react";
import SSOLinkCallback from "../page";

const replace = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ replace: (...a: unknown[]) => replace(...a) }) }));
jest.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock("@/utils/logger", () => ({ logger: { warn: jest.fn() } }));

const toastSuccess = jest.fn();
const toastError = jest.fn();
jest.mock("sonner", () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a), error: (...a: unknown[]) => toastError(...a) },
}));

function mockLocation(search: string) {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { search, pathname: "/sso/link-callback" },
  });
}

// The jest env ships a no-op Storage; install a real Map-backed one.
function installLocalStorage() {
  const m = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => (m.has(k) ? m.get(k) : null),
      setItem: (k: string, v: string) => m.set(k, String(v)),
      removeItem: (k: string) => m.delete(k),
      clear: () => m.clear(),
    },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  installLocalStorage();
  (global.fetch as jest.Mock) = jest.fn();
});

describe("SSOLinkCallback", () => {
  it("redirects home immediately when the access_token or jwt is missing", async () => {
    mockLocation("");
    render(<SSOLinkCallback />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("posts the token to the link endpoint with the JWT and redirects on success", async () => {
    mockLocation("?access_token=mw-token");
    window.localStorage.setItem("token", "jwt-abc");
    (global.fetch as jest.Mock) = jest.fn(() => Promise.resolve({ ok: true }));

    render(<SSOLinkCallback />);

    await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("navigation.profile.linkSuccess"));
    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("/api/erp/meta/sso/link");
    expect(opts.method).toBe("POST");
    expect(opts.headers.Authorization).toBe("Bearer jwt-abc");
    expect(JSON.parse(opts.body)).toEqual({ accessToken: "mw-token" });
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("shows an error toast when the link request fails", async () => {
    mockLocation("?access_token=mw-token");
    window.localStorage.setItem("token", "jwt-abc");
    (global.fetch as jest.Mock) = jest.fn(() => Promise.resolve({ ok: false, status: 404 }));

    render(<SSOLinkCallback />);

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("navigation.profile.linkError"));
    expect(replace).not.toHaveBeenCalled();
  });
});
