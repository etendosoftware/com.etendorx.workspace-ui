import { renderHook, waitFor } from "@testing-library/react";
import { useToolbar } from "../useToolbar";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { useTabContext } from "@/contexts/tab";
import { useSelectedRecords } from "@/hooks/useSelectedRecords";
import { useUserContext } from "@/hooks/useUserContext";
import { TOOLBAR_BUTTONS_ACTIONS } from "@/utils/toolbar/constants";
// import { UIPattern } from "@workspaceui/api-client/src/api/types"; // Avoid import issue

// Mock dependencies
jest.mock("@workspaceui/api-client/src/api/metadata");
jest.mock("@/contexts/tab");
jest.mock("@/hooks/useSelectedRecords");
jest.mock("@/hooks/useFormFields", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/hooks/useUserContext");

// Mock Constants
// jest.mock("@/utils/toolbar/constants", () => ({
//   TOOLBAR_BUTTONS_ACTIONS: {
//     NEW: "NEW",
//     DELETE: "DELETE",
//     SAVE: "SAVE",
//     COPY_RECORD: "COPY_RECORD",
//   },
// }));

describe("useToolbar", () => {
  const mockButtons = [
    { id: "btn_new", action: TOOLBAR_BUTTONS_ACTIONS.NEW, active: true },
    { id: "btn_delete", action: TOOLBAR_BUTTONS_ACTIONS.DELETE, active: true },
    { id: "btn_save", action: TOOLBAR_BUTTONS_ACTIONS.SAVE, active: true },
    { id: "btn_copy", action: TOOLBAR_BUTTONS_ACTIONS.COPY_RECORD, active: true },
    { id: "btn_other", action: "OTHER", active: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (Metadata.getToolbar as jest.Mock).mockResolvedValue(mockButtons);
    (useSelectedRecords as jest.Mock).mockReturnValue([]);
    (useUserContext as jest.Mock).mockReturnValue({ session: {} });
    // Mock useFormFields to return empty actionFields
    const useFormFieldsMock = require("@/hooks/useFormFields").default;
    useFormFieldsMock.mockReturnValue({ fields: { actionFields: {} } });
  });

  const setup = (uIPattern?: any) => {
    (useTabContext as jest.Mock).mockReturnValue({
      tab: { uIPattern },
    });
    return renderHook(() => useToolbar("window1", "tab1"));
  };

  it("should return all buttons when uIPattern is undefined (or STANDARD)", async () => {
    const { result } = setup(undefined);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.buttons).toHaveLength(mockButtons.length);
  });

  it("should return all buttons as-is regardless of uIPattern", async () => {
    // READ_ONLY
    const { result } = setup("RO");

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.buttons).toHaveLength(mockButtons.length);
    // All should be active: true as in mockButtons
    for (const b of result.current.buttons) {
      expect(b.active).toBe(true);
    }
  });
});
