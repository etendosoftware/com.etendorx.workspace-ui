import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  fetchInstancePurpose,
  saveInstancePurpose,
  type InstancePurposeState,
} from "@workspaceui/api-client/src/api/instancePurpose";
import InstancePurposeModal from "../InstancePurposeModal";

jest.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("@/utils/logger", () => ({ logger: { warn: jest.fn(), error: jest.fn() } }));
jest.mock("@workspaceui/api-client/src/api/instancePurpose", () => ({
  fetchInstancePurpose: jest.fn(),
  saveInstancePurpose: jest.fn(),
}));
jest.mock("@workspaceui/componentlibrary/src/components/BasicModal", () => ({
  __esModule: true,
  default: ({
    tittleHeader,
    children,
    onSave,
    onClose,
    saveButtonLabel,
    SaveIcon,
  }: {
    tittleHeader?: string;
    children: React.ReactNode;
    onSave?: () => void;
    onClose?: () => void;
    saveButtonLabel?: string;
    SaveIcon?: React.ElementType;
  }) => (
    <dialog open aria-label={tittleHeader}>
      {children}
      {/* Like the real modal, the footer button needs both a label and an icon to be drawn. */}
      {saveButtonLabel && SaveIcon && (
        <button type="button" onClick={onSave}>
          {saveButtonLabel}
        </button>
      )}
      <button type="button" onClick={onClose}>
        close
      </button>
    </dialog>
  ),
}));
// Native <select> instead of the MUI autocomplete, which is not worth driving in jsdom.
jest.mock("@workspaceui/componentlibrary/src/components/Input/Select", () => ({
  __esModule: true,
  default: ({
    options,
    onChange,
    helperText,
  }: {
    options: { id: string; value: string; title: string }[];
    onChange: (event: unknown, value: unknown) => void;
    helperText?: { label?: string };
  }) => (
    <div>
      <select
        aria-label="purpose"
        defaultValue=""
        onChange={(e) => onChange(e, options.find((o) => o.value === e.target.value) ?? null)}>
        <option value="" />
        {options.map((o) => (
          <option key={o.id} value={o.value}>
            {o.title}
          </option>
        ))}
      </select>
      {helperText?.label && <span role="alert">{helperText.label}</span>}
    </div>
  ),
}));

let userState: { token: string | null; currentRole?: { id: string }; passwordExpired: boolean };
jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (s: unknown) => unknown) => selector(userState),
}));

const mockFetch = fetchInstancePurpose as jest.Mock;
const mockSave = saveInstancePurpose as jest.Mock;

const state = (extra: Partial<InstancePurposeState> = {}): InstancePurposeState => ({
  required: true,
  purpose: null,
  options: ["P", "D", "T", "E"],
  ...extra,
});

const renderAndSettle = async () => {
  render(<InstancePurposeModal />);
  await act(async () => {});
};

describe("InstancePurposeModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userState = { token: "jwt", currentRole: { id: "0" }, passwordExpired: false };
    mockFetch.mockResolvedValue(state());
    mockSave.mockResolvedValue(state({ required: false, purpose: "D" }));
  });

  it("shows the modal with the four purposes when the backend requires the configuration", async () => {
    await renderAndSettle();

    expect(screen.getByRole("dialog", { name: "instancePurpose.title" })).toBeInTheDocument();
    expect(screen.getByText("instancePurpose.welcome")).toBeInTheDocument();
    for (const key of ["production", "development", "testing", "evaluation"]) {
      expect(screen.getByText(`instancePurpose.${key}`)).toBeInTheDocument();
    }
  });

  it("does not show the modal once the purpose is configured", async () => {
    mockFetch.mockResolvedValue(state({ required: false, purpose: "P" }));
    await renderAndSettle();

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it.each([
    ["without a token", { token: null }],
    ["without a role", { currentRole: undefined }],
    ["while the password is expired", { passwordExpired: true }],
  ])("does not even check the purpose %s", async (_label, override) => {
    userState = { ...userState, ...override };
    await renderAndSettle();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stays out of the way when the check fails", async () => {
    mockFetch.mockRejectedValue(new Error("boom"));
    await renderAndSettle();

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("asks for a purpose before saving", async () => {
    await renderAndSettle();

    fireEvent.click(screen.getByText("instancePurpose.continue"));

    expect(await screen.findByRole("alert")).toHaveTextContent("instancePurpose.required");
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("saves the chosen purpose and closes the modal", async () => {
    await renderAndSettle();

    fireEvent.change(screen.getByLabelText("purpose"), { target: { value: "D" } });
    fireEvent.click(screen.getByText("instancePurpose.continue"));

    await waitFor(() => expect(mockSave).toHaveBeenCalledWith("D"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("keeps the modal open and reports the error when saving fails", async () => {
    mockSave.mockRejectedValue(new Error("403"));
    await renderAndSettle();

    fireEvent.change(screen.getByLabelText("purpose"), { target: { value: "P" } });
    fireEvent.click(screen.getByText("instancePurpose.continue"));

    expect(await screen.findByRole("alert")).toHaveTextContent("instancePurpose.error");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("clears the validation message once a purpose is chosen", async () => {
    await renderAndSettle();
    fireEvent.click(screen.getByText("instancePurpose.continue"));
    await screen.findByRole("alert");

    fireEvent.change(screen.getByLabelText("purpose"), { target: { value: "T" } });

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("hides the modal for the session when it is closed without choosing", async () => {
    await renderAndSettle();

    fireEvent.click(screen.getByText("close"));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("checks again when the session switches to another role", async () => {
    const { rerender } = render(<InstancePurposeModal />);
    await act(async () => {});
    expect(mockFetch).toHaveBeenCalledTimes(1);

    userState = { ...userState, currentRole: { id: "other" } };
    rerender(<InstancePurposeModal />);
    await act(async () => {});

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
