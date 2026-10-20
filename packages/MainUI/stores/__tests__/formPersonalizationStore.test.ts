import {
  deleteFormPersonalization,
  fetchFormPersonalization,
  type FormPersonalizationState,
  saveFormPersonalization,
} from "@workspaceui/api-client/src/api/formPersonalization";
import { formPersonalizationKey, useFormPersonalizationStore } from "../formPersonalizationStore";

jest.mock("@workspaceui/api-client/src/api/formPersonalization", () => ({
  fetchFormPersonalization: jest.fn(),
  saveFormPersonalization: jest.fn(),
  deleteFormPersonalization: jest.fn(),
}));

const mockFetch = fetchFormPersonalization as jest.Mock;
const mockSave = saveFormPersonalization as jest.Mock;
const mockDelete = deleteFormPersonalization as jest.Mock;

const KEY = formPersonalizationKey("role", "org", "tab");

const stateOf = (id: string | null): FormPersonalizationState => ({
  tab: "tab",
  personalization: id ? { id, scope: "USER", form: { fields: [{ name: "a" }] }, canEdit: true } : null,
  permissions: { scopes: ["USER"], roles: [], organizations: [] },
});

const entry = () => useFormPersonalizationStore.getState().entries[KEY];

describe("formPersonalizationStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFormPersonalizationStore.getState().reset();
    mockFetch.mockResolvedValue(stateOf("p1"));
  });

  it("builds a key per role, organization and tab", () => {
    expect(formPersonalizationKey("r", "o", "t")).toBe("r|o|t");
    expect(formPersonalizationKey("r", "o2", "t")).not.toBe(formPersonalizationKey("r", "o", "t"));
  });

  it("loads the personalization of a tab", async () => {
    await useFormPersonalizationStore.getState().load(KEY, "tab");

    expect(mockFetch).toHaveBeenCalledWith("tab");
    expect(entry().status).toBe("ready");
    expect(entry().state?.personalization?.id).toBe("p1");
  });

  it("does not load the same tab twice", async () => {
    await useFormPersonalizationStore.getState().load(KEY, "tab");
    await useFormPersonalizationStore.getState().load(KEY, "tab");

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("shares the request between concurrent loads", async () => {
    await Promise.all([
      useFormPersonalizationStore.getState().load(KEY, "tab"),
      useFormPersonalizationStore.getState().load(KEY, "tab", true),
    ]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("reads it again when forced", async () => {
    await useFormPersonalizationStore.getState().load(KEY, "tab");
    await useFormPersonalizationStore.getState().load(KEY, "tab", true);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("keeps the dictionary's layout when the personalization cannot be read", async () => {
    mockFetch.mockRejectedValue(new Error("boom"));

    await useFormPersonalizationStore.getState().load(KEY, "tab");

    expect(entry().status).toBe("error");
    expect(entry().state).toBeUndefined();
  });

  it("can load again after a failure when forced", async () => {
    mockFetch.mockRejectedValueOnce(new Error("boom"));
    await useFormPersonalizationStore.getState().load(KEY, "tab");

    await useFormPersonalizationStore.getState().load(KEY, "tab", true);

    expect(entry().status).toBe("ready");
  });

  it("saves and reads back the personalization that applies", async () => {
    mockSave.mockResolvedValue(stateOf("saved"));
    mockFetch.mockResolvedValue(stateOf("effective"));
    const params = { tabId: "tab", form: { fields: [{ name: "a" }] }, scope: "ROLE" as const };

    await useFormPersonalizationStore.getState().save(KEY, params);

    expect(mockSave).toHaveBeenCalledWith(params);
    expect(entry().state?.personalization?.id).toBe("effective");
  });

  it("does not read anything back when saving fails", async () => {
    mockSave.mockRejectedValue(new Error("403"));

    await expect(
      useFormPersonalizationStore.getState().save(KEY, { tabId: "tab", form: { fields: [] } })
    ).rejects.toThrow("403");

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("discards a personalization and reads back what applies afterwards", async () => {
    await useFormPersonalizationStore.getState().load(KEY, "tab");
    mockDelete.mockResolvedValue(undefined);
    mockFetch.mockResolvedValue(stateOf(null));

    await useFormPersonalizationStore.getState().remove(KEY, "tab", "p1");

    expect(mockDelete).toHaveBeenCalledWith("p1");
    expect(entry().state?.personalization).toBeNull();
  });

  it("forgets everything on reset", async () => {
    await useFormPersonalizationStore.getState().load(KEY, "tab");

    useFormPersonalizationStore.getState().reset();

    expect(useFormPersonalizationStore.getState().entries).toEqual({});
  });
});
