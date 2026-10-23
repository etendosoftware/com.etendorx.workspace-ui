import { act, fireEvent, render, screen, within } from "@testing-library/react";
import type {
  FormPersonalizationPermissions,
  StoredFormPersonalization,
} from "@workspaceui/api-client/src/api/formPersonalization";
import type { Field, Tab } from "@workspaceui/api-client/src/api/types";
import PersonalizeFormModal from "../PersonalizeFormModal";

jest.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("@/utils/logger", () => ({ logger: { warn: jest.fn(), error: jest.fn() } }));

jest.mock("@workspaceui/componentlibrary/src/components/BasicModal", () => ({
  __esModule: true,
  default: ({
    tittleHeader,
    children,
    buttons,
  }: {
    tittleHeader?: string;
    children: React.ReactNode;
    buttons?: React.ReactNode;
  }) => (
    <dialog open aria-label={tittleHeader}>
      {children}
      <div data-testid="footer">{buttons}</div>
    </dialog>
  ),
}));
jest.mock("@workspaceui/componentlibrary/src/components/Button/Button", () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));
// The real list needs drag and drop; this one renders the rows and lets a test reverse their order.
jest.mock("@workspaceui/componentlibrary/src/components/SortableList", () => ({
  __esModule: true,
  default: ({
    items,
    onReorder,
    renderItem,
  }: {
    items: { id: string }[];
    onReorder: (items: { id: string }[], move: { from: number; to: number }) => void;
    renderItem: (item: { id: string }, handle: unknown) => React.ReactNode;
  }) => (
    <div>
      <button
        type="button"
        onClick={() => onReorder([items[items.length - 1], ...items.slice(0, -1)], { from: items.length - 1, to: 0 })}>
        last-to-first
      </button>
      <button type="button" onClick={() => onReorder([...items.slice(1), items[0]], { from: 0, to: items.length - 1 })}>
        first-to-last
      </button>
      {items.map((item) => (
        <div key={item.id}>
          {renderItem(item, { attributes: {}, listeners: {}, setActivatorNodeRef: () => {}, isDragging: false })}
        </div>
      ))}
    </div>
  ),
}));

jest.mock("@/hooks/useRecordDisplayLogic", () => ({ useRecordDisplayLogic: () => () => false }));
const mockSetExpanded = jest.fn();
jest.mock("@/contexts/CurrentWindowContext", () => ({ useCurrentWindowIdentifier: () => "win-1" }));
jest.mock("@/stores/windowStore", () => ({
  useWindowStore: (selector: (s: unknown) => unknown) => selector({ setTabExpandedSections: mockSetExpanded }),
}));

const mockSave = jest.fn();
const mockDiscard = jest.fn();
let personalization: StoredFormPersonalization | null;
let permissions: FormPersonalizationPermissions;
jest.mock("@/hooks/useFormPersonalization", () => ({
  useFormPersonalization: () => ({
    status: "ready",
    personalization,
    permissions,
    save: mockSave,
    discard: mockDiscard,
  }),
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (s: unknown) => unknown) =>
    selector({ currentRole: { id: "role-1" }, currentOrganization: { id: "org-1" } }),
}));

const makeField = (hqlName: string, extra: Partial<Field> = {}): Field =>
  ({
    id: `id-${hqlName}`,
    hqlName,
    name: `Label ${hqlName}`,
    displayed: true,
    sequenceNumber: 10,
    shownInStatusBar: false,
    startnewline: false,
    obuiappColspan: null,
    obuiappRowspan: null,
    isFirstFocusedField: false,
    isMandatory: false,
    column: { reference: "10" },
    ...extra,
  }) as unknown as Field;

const tab = {
  id: "tab-1",
  fields: Object.fromEntries(
    [
      makeField("a", { sequenceNumber: 10 }),
      makeField("b", { sequenceNumber: 20, isMandatory: true }),
      makeField("c", { sequenceNumber: 30, shownInStatusBar: true }),
    ].map((f) => [f.hqlName, f])
  ),
} as unknown as Tab;

const row = (id: string) => screen.getByTestId(`personalize-field-${id}`);
const lastSavedForm = () => mockSave.mock.calls[mockSave.mock.calls.length - 1][0].form.fields;

const renderModal = (onClose = jest.fn()) => {
  render(<PersonalizeFormModal tab={tab} onClose={onClose} />);
  return onClose;
};

describe("PersonalizeFormModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    personalization = null;
    permissions = { scopes: ["USER"], roles: [], organizations: [] };
    mockSave.mockResolvedValue(undefined);
    mockDiscard.mockResolvedValue(undefined);
  });

  it("lists the status bar and the sections with the fields of the form", () => {
    renderModal();

    expect(screen.getByRole("dialog", { name: "formPersonalization.title" })).toBeInTheDocument();
    expect(screen.getByTestId("personalize-section-status-bar")).toBeInTheDocument();
    expect(screen.getByTestId("personalize-section-_main")).toBeInTheDocument();
    for (const id of ["a", "b", "c"]) {
      expect(row(id)).toBeInTheDocument();
    }
  });

  it("starts from the personalization in effect", () => {
    personalization = {
      id: "p1",
      scope: "USER",
      canEdit: true,
      form: { fields: [{ name: "a", hiddenInForm: true, colSpan: 2 }] },
    };

    renderModal();

    expect(within(row("a")).getByRole("button", { name: "formPersonalization.show" })).toBeInTheDocument();
    expect(within(row("a")).getByLabelText("formPersonalization.columns")).toHaveValue("2");
  });

  it("hides a field and saves it as hidden", async () => {
    renderModal();

    fireEvent.click(within(row("a")).getByRole("button", { name: "formPersonalization.hide" }));
    await act(async () => fireEvent.click(screen.getByText("formPersonalization.save")));

    expect(lastSavedForm().find((f: { name: string }) => f.name === "a")).toMatchObject({ hiddenInForm: true });
  });

  it("does not let a required field be hidden", () => {
    renderModal();

    expect(within(row("b")).getByRole("button", { name: "formPersonalization.hide" })).toBeDisabled();
    expect(within(row("a")).getByRole("button", { name: "formPersonalization.hide" })).toBeEnabled();
  });

  it("changes the columns of a field and where its row starts", async () => {
    renderModal();

    fireEvent.change(within(row("a")).getByLabelText("formPersonalization.columns"), { target: { value: "3" } });
    fireEvent.click(within(row("a")).getByLabelText("formPersonalization.startRow"));
    await act(async () => fireEvent.click(screen.getByText("formPersonalization.save")));

    expect(lastSavedForm().find((f: { name: string }) => f.name === "a")).toMatchObject({ colSpan: 3, startRow: true });
  });

  it("does not offer columns or row start for a status bar field", () => {
    renderModal();

    expect(within(row("c")).queryByLabelText("formPersonalization.columns")).toBeNull();
    expect(within(row("a")).getByLabelText("formPersonalization.columns")).toBeInTheDocument();
  });

  it("moves the initial focus to one field at a time", async () => {
    renderModal();

    fireEvent.click(within(row("a")).getByLabelText("formPersonalization.initialFocus"));
    fireEvent.click(within(row("b")).getByLabelText("formPersonalization.initialFocus"));
    await act(async () => fireEvent.click(screen.getByText("formPersonalization.save")));

    const fields = lastSavedForm();
    expect(fields.find((f: { name: string }) => f.name === "b")).toMatchObject({ firstFocus: true });
    expect(fields.find((f: { name: string }) => f.name === "a")).not.toHaveProperty("firstFocus");
  });

  it("saves whether a section opens expanded", async () => {
    renderModal();

    fireEvent.click(within(screen.getByTestId("personalize-section-_main")).getByRole("checkbox"));
    await act(async () => fireEvent.click(screen.getByText("formPersonalization.save")));

    expect(lastSavedForm().find((f: { name: string }) => f.name === "_main")).toMatchObject({
      isSection: true,
      sectionExpanded: false,
    });
  });

  it("saves the new order of the rows, keeping the status bar first", async () => {
    renderModal();

    fireEvent.click(screen.getByText("first-to-last"));
    await act(async () => fireEvent.click(screen.getByText("formPersonalization.save")));

    const names = lastSavedForm().map((f: { name: string }) => f.name);
    expect(names.indexOf("b")).toBeLessThan(names.indexOf("c"));
    expect(lastSavedForm().find((f: { name: string }) => f.name === "c")).not.toHaveProperty("isStatusBarField");
  });

  it("ignores a move that puts a mandatory field without a default value in the status bar", async () => {
    renderModal();

    // Dropping "b" (mandatory, no default) at the top puts it in the status bar
    fireEvent.click(screen.getByText("last-to-first"));
    await act(async () => fireEvent.click(screen.getByText("formPersonalization.save")));

    const names = lastSavedForm().map((f: { name: string }) => f.name);
    expect(names.indexOf("a")).toBeLessThan(names.indexOf("b"));
  });

  it("has no initial focus choice for the fields of the status bar", () => {
    renderModal();

    expect(within(row("c")).queryByLabelText("formPersonalization.initialFocus")).toBeNull();
    expect(within(row("a")).getByLabelText("formPersonalization.initialFocus")).toBeInTheDocument();
  });

  it("keeps every field hidden when several are hidden before the list redraws", async () => {
    renderModal();

    // Both clicks happen in one batch, so the second must build on the first
    act(() => {
      fireEvent.click(within(row("a")).getByRole("button", { name: "formPersonalization.hide" }));
      fireEvent.click(within(row("c")).getByRole("button", { name: "formPersonalization.hide" }));
    });
    await act(async () => fireEvent.click(screen.getByText("formPersonalization.save")));

    const hidden = lastSavedForm()
      .filter((f: { hiddenInForm?: boolean }) => f.hiddenInForm)
      .map((f: { name: string }) => f.name);
    expect(hidden).toEqual(expect.arrayContaining(["a", "c"]));
  });

  it("re-seeds the open sections of the tab with the ones the personalization asks for", async () => {
    renderModal();

    await act(async () => fireEvent.click(screen.getByText("formPersonalization.save")));

    expect(mockSetExpanded).toHaveBeenCalledWith("win-1", "tab-1", expect.arrayContaining(["_main"]), 0);
  });

  it("says which conditional fields the record being edited does not show", () => {
    const conditionalTab = {
      id: "tab-1",
      fields: Object.fromEntries(
        [makeField("a", { displayLogic: "@x@='Y'" }), makeField("b")].map((f) => [f.hqlName, f])
      ),
    } as unknown as Tab;

    render(<PersonalizeFormModal tab={conditionalTab} onClose={jest.fn()} />);

    expect(within(row("a")).getByText("formPersonalization.conditionalHidden")).toBeInTheDocument();
    expect(within(row("b")).queryByText(/formPersonalization.conditional/)).toBeNull();
  });

  it("does not mark a status bar field as hidden for the record, as the bar ignores display logic", () => {
    const barTab = {
      id: "tab-1",
      fields: Object.fromEntries(
        [makeField("a"), makeField("c", { shownInStatusBar: true, displayLogic: "@x@='Y'" })].map((f) => [f.hqlName, f])
      ),
    } as unknown as Tab;

    render(<PersonalizeFormModal tab={barTab} onClose={jest.fn()} />);

    expect(within(row("c")).queryByText(/formPersonalization.conditional/)).toBeNull();
  });

  it("marks a section none of whose fields the record shows", () => {
    const conditionalTab = {
      id: "tab-1",
      fields: Object.fromEntries(
        [
          makeField("a"),
          makeField("p", { fieldGroup: "g1", fieldGroupName: "Plan", displayLogic: "@x@='Y'" }),
          makeField("q", { fieldGroup: "g1", fieldGroupName: "Plan", displayLogic: "@x@='Y'" }),
        ].map((f) => [f.hqlName, f])
      ),
    } as unknown as Tab;

    render(<PersonalizeFormModal tab={conditionalTab} onClose={jest.fn()} />);

    expect(
      within(screen.getByTestId("personalize-section-g1")).getByText("formPersonalization.conditionalHidden")
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("personalize-section-_main")).queryByText("formPersonalization.conditionalHidden")
    ).toBeNull();
  });

  it("saves for the user by default and closes", async () => {
    const onClose = renderModal();

    await act(async () => fireEvent.click(screen.getByText("formPersonalization.save")));

    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ scope: "USER" }));
    expect(mockSave.mock.calls[0][0]).not.toHaveProperty("role");
    expect(onClose).toHaveBeenCalled();
  });

  it("saves for the role picked in the selector", async () => {
    permissions = {
      scopes: ["USER", "ROLE"],
      roles: [
        { id: "role-1", name: "R1" },
        { id: "role-2", name: "R2" },
      ],
      organizations: [],
    };
    renderModal();

    fireEvent.change(screen.getByLabelText("formPersonalization.applyTo"), { target: { value: "ROLE" } });
    fireEvent.change(screen.getByLabelText("formPersonalization.role"), { target: { value: "role-2" } });
    await act(async () => fireEvent.click(screen.getByText("formPersonalization.save")));

    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ scope: "ROLE", role: "role-2" }));
  });

  it("offers only the levels the session may save at", () => {
    permissions = { scopes: ["USER", "ROLE", "CLIENT"], roles: [{ id: "role-1", name: "R1" }], organizations: [] };
    renderModal();

    const options = within(screen.getByLabelText("formPersonalization.applyTo")).getAllByRole("option");

    expect(options.map((o) => o.textContent)).toEqual([
      "formPersonalization.scope.USER",
      "formPersonalization.scope.ROLE",
      "formPersonalization.scope.CLIENT",
    ]);
  });

  it("saves for a role, the current one by default", async () => {
    permissions = {
      scopes: ["USER", "ROLE"],
      roles: [
        { id: "other", name: "Other" },
        { id: "role-1", name: "R1" },
      ],
      organizations: [],
    };
    renderModal();

    fireEvent.change(screen.getByLabelText("formPersonalization.applyTo"), { target: { value: "ROLE" } });
    expect(screen.getByLabelText("formPersonalization.role")).toHaveValue("role-1");
    await act(async () => fireEvent.click(screen.getByText("formPersonalization.save")));

    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ scope: "ROLE", role: "role-1" }));
  });

  it("saves for the organization that is chosen", async () => {
    permissions = {
      scopes: ["USER", "ORGANIZATION"],
      roles: [],
      organizations: [
        { id: "org-1", name: "O1" },
        { id: "org-2", name: "O2" },
      ],
    };
    renderModal();

    fireEvent.change(screen.getByLabelText("formPersonalization.applyTo"), { target: { value: "ORGANIZATION" } });
    fireEvent.change(screen.getByLabelText("formPersonalization.organization"), { target: { value: "org-2" } });
    await act(async () => fireEvent.click(screen.getByText("formPersonalization.save")));

    expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ scope: "ORGANIZATION", organization: "org-2" }));
  });

  it("keeps the modal open and says so when saving fails", async () => {
    mockSave.mockRejectedValue(new Error("403"));
    const onClose = renderModal();

    await act(async () => fireEvent.click(screen.getByText("formPersonalization.save")));

    expect(screen.getByRole("alert")).toHaveTextContent("formPersonalization.saveError");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("only offers to restore the default layout when there is a personalization to discard", () => {
    renderModal();

    expect(screen.queryByText("formPersonalization.reset")).toBeNull();
  });

  it("asks before discarding the personalization, and then restores the layout", async () => {
    personalization = { id: "p1", scope: "USER", canEdit: true, form: { fields: [{ name: "a" }] } };
    const onClose = renderModal();

    fireEvent.click(screen.getByText("formPersonalization.reset"));
    expect(mockDiscard).not.toHaveBeenCalled();
    expect(screen.getByText("formPersonalization.resetConfirm")).toBeInTheDocument();

    await act(async () => fireEvent.click(screen.getByText("formPersonalization.resetConfirmYes")));

    expect(mockDiscard).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalled();
  });

  it("can back out of discarding", () => {
    personalization = { id: "p1", scope: "USER", canEdit: true, form: { fields: [{ name: "a" }] } };
    renderModal();

    fireEvent.click(screen.getByText("formPersonalization.reset"));
    fireEvent.click(screen.getAllByText("common.cancel")[0]);

    expect(mockDiscard).not.toHaveBeenCalled();
    expect(screen.getByText("formPersonalization.reset")).toBeInTheDocument();
  });

  it("reports when the personalization cannot be discarded", async () => {
    personalization = { id: "p1", scope: "USER", canEdit: true, form: { fields: [{ name: "a" }] } };
    mockDiscard.mockRejectedValue(new Error("403"));
    const onClose = renderModal();

    fireEvent.click(screen.getByText("formPersonalization.reset"));
    await act(async () => fireEvent.click(screen.getByText("formPersonalization.resetConfirmYes")));

    expect(screen.getByRole("alert")).toHaveTextContent("formPersonalization.resetError");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("cannot discard a shared personalization the session does not administer, and says it applies", () => {
    personalization = { id: "p1", scope: "ROLE", canEdit: false, form: { fields: [{ name: "a" }] } };
    renderModal();

    expect(screen.queryByText("formPersonalization.reset")).toBeNull();
    expect(screen.getByRole("note")).toHaveTextContent("formPersonalization.sharedReadOnly");
  });

  it("closes without saving on cancel", () => {
    const onClose = renderModal();

    fireEvent.click(screen.getAllByText("common.cancel")[0]);

    expect(onClose).toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });
});
