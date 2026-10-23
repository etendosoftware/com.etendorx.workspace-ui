import { act, renderHook } from "@testing-library/react";
import type { FormPersonalizationState } from "@workspaceui/api-client/src/api/formPersonalization";
import { useFormPersonalizationStore } from "@/stores/formPersonalizationStore";
import { useFormPersonalization } from "../useFormPersonalization";

const mockFetch = jest.fn();
const mockSave = jest.fn();
const mockDelete = jest.fn();
jest.mock("@workspaceui/api-client/src/api/formPersonalization", () => ({
  fetchFormPersonalization: (...args: unknown[]) => mockFetch(...args),
  saveFormPersonalization: (...args: unknown[]) => mockSave(...args),
  deleteFormPersonalization: (...args: unknown[]) => mockDelete(...args),
}));

let userState: { token: string | null; currentRole?: { id: string }; currentOrganization?: { id: string } };
jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (s: unknown) => unknown) => selector(userState),
}));

const stateOf = (id: string | null): FormPersonalizationState => ({
  tab: "tab",
  personalization: id ? { id, scope: "USER", form: { fields: [{ name: "a" }] }, canEdit: true } : null,
  permissions: { scopes: ["USER", "ROLE"], roles: [{ id: "r", name: "R" }], organizations: [] },
});

describe("useFormPersonalization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFormPersonalizationStore.getState().reset();
    userState = { token: "jwt", currentRole: { id: "role" }, currentOrganization: { id: "org" } };
    mockFetch.mockResolvedValue(stateOf("p1"));
    mockSave.mockResolvedValue(stateOf("p1"));
    mockDelete.mockResolvedValue(undefined);
  });

  it("loads the personalization of the tab and exposes it with the permissions", async () => {
    const { result } = renderHook(() => useFormPersonalization("tab"));
    await act(async () => {});

    expect(mockFetch).toHaveBeenCalledWith("tab");
    expect(result.current.status).toBe("ready");
    expect(result.current.personalization?.id).toBe("p1");
    expect(result.current.permissions.scopes).toEqual(["USER", "ROLE"]);
  });

  it("only offers the user level until it is loaded", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useFormPersonalization("tab"));

    expect(result.current.permissions.scopes).toEqual(["USER"]);
    expect(result.current.personalization).toBeNull();
  });

  it.each([
    ["no tab", undefined, {}],
    ["no token", "tab", { token: null }],
    ["no role", "tab", { currentRole: undefined }],
  ])("loads nothing with %s", async (_label, tab, override) => {
    userState = { ...userState, ...override };

    const { result } = renderHook(() => useFormPersonalization(tab));
    await act(async () => {});

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
  });

  it("reads it again for another organization", async () => {
    const { rerender } = renderHook(() => useFormPersonalization("tab"));
    await act(async () => {});

    userState = { ...userState, currentOrganization: { id: "other-org" } };
    rerender();
    await act(async () => {});

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("saves for the tab and reads the result back", async () => {
    const { result } = renderHook(() => useFormPersonalization("tab"));
    await act(async () => {});
    const form = { fields: [{ name: "a" }] };

    await act(async () => result.current.save({ form, scope: "ROLE" }));

    expect(mockSave).toHaveBeenCalledWith({ tabId: "tab", form, scope: "ROLE" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("discards the personalization that applies", async () => {
    const { result } = renderHook(() => useFormPersonalization("tab"));
    await act(async () => {});

    await act(async () => result.current.discard());

    expect(mockDelete).toHaveBeenCalledWith("p1");
  });

  it("has nothing to discard without a personalization", async () => {
    mockFetch.mockResolvedValue(stateOf(null));
    const { result } = renderHook(() => useFormPersonalization("tab"));
    await act(async () => {});

    await act(async () => result.current.discard());

    expect(mockDelete).not.toHaveBeenCalled();
  });
});
