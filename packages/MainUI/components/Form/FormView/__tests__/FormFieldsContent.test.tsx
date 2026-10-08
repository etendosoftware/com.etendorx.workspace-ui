/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type React from "react";
import { render, screen } from "@testing-library/react";
import { FormMode } from "@workspaceui/api-client/src/api/types";
import type { Field, Tab } from "@workspaceui/api-client/src/api/types";
import { useDisplayLogicFormValues } from "@/hooks/evaluation/useDisplayLogicFormValues";
import { createSmartContext } from "@/utils/expressions";
import { FormFields } from "../FormFieldsContent";

// ─── Module mocks ────────────────────────────────────────────────────────────

jest.mock("@/hooks/evaluation/useDisplayLogicFormValues", () => ({
  useDisplayLogicFormValues: jest.fn(() => ({})),
}));

const mockSession = {};
jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: any) => selector({ session: mockSession }),
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: jest.fn(() => ({ t: (key: string) => key })),
}));

jest.mock("../contexts/FormViewContext", () => ({
  useFormViewContext: jest.fn(() => ({
    expandedSections: ["notes_group", "attachments_group", "linked-items"],
    selectedTab: "",
    handleSectionRef: jest.fn(() => jest.fn()),
    handleAccordionChange: jest.fn(),
    isSectionExpanded: jest.fn(() => true),
    getIconForGroup: jest.fn(() => null),
  })),
}));

jest.mock("@/components/Form/Collapsible", () => ({
  __esModule: true,
  default: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid={`collapsible-${title}`}>
      <span>{title}</span>
      {children}
    </div>
  ),
}));

jest.mock("../selectors/BaseSelector", () => ({
  BaseSelector: () => <div data-testid="base-selector" />,
  compileExpression: jest.fn(() => () => true),
}));

jest.mock("@/utils/expressions", () => ({
  createSmartContext: jest.fn(() => ({})),
}));

jest.mock("../Sections/noteSection", () => ({
  __esModule: true,
  default: () => <div data-testid="note-section" />,
}));

jest.mock("../Sections/AttachmentSection", () => ({
  __esModule: true,
  default: () => <div data-testid="attachment-section" />,
}));

jest.mock("../Sections/LinkedItemsSection", () => ({
  __esModule: true,
  default: () => <div data-testid="linked-items-section" />,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeField = (overrides: Partial<Field> = {}): Field =>
  ({
    hqlName: "testField",
    displayed: true,
    displayLogicExpression: null,
    column: { reference: "string" },
    ...overrides,
  }) as unknown as Field;

const makeTab = (): Tab =>
  ({
    id: "tab1",
    table: "table1",
    entityName: "Entity",
    fields: { testField: makeField() },
  }) as unknown as Tab;

const baseProps = {
  tab: makeTab(),
  groups: [] as Array<[string | null, { identifier: string; fields: Record<string, Field> }]>,
  loading: false,
  recordId: "rec-001",
  initialNoteCount: 0,
  initialAttachmentCount: 0,
  onNotesChange: jest.fn(),
  onAttachmentsChange: jest.fn(),
};

const renderFormFields = (mode: FormMode) => render(<FormFields {...baseProps} mode={mode} />);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("FormFields — Notes / Attachments / LinkedItems visibility by mode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when mode is FormMode.NEW", () => {
    it("does NOT render the NoteSection", () => {
      renderFormFields(FormMode.NEW);
      expect(screen.queryByTestId("note-section")).not.toBeInTheDocument();
    });

    it("does NOT render the AttachmentSection", () => {
      renderFormFields(FormMode.NEW);
      expect(screen.queryByTestId("attachment-section")).not.toBeInTheDocument();
    });

    it("does NOT render the LinkedItemsSection", () => {
      renderFormFields(FormMode.NEW);
      expect(screen.queryByTestId("linked-items-section")).not.toBeInTheDocument();
    });
  });

  describe("when mode is FormMode.EDIT", () => {
    it("renders the NoteSection", () => {
      renderFormFields(FormMode.EDIT);
      expect(screen.getByTestId("note-section")).toBeInTheDocument();
    });

    it("renders the AttachmentSection", () => {
      renderFormFields(FormMode.EDIT);
      expect(screen.getByTestId("attachment-section")).toBeInTheDocument();
    });

    it("renders the LinkedItemsSection", () => {
      renderFormFields(FormMode.EDIT);
      expect(screen.getByTestId("linked-items-section")).toBeInTheDocument();
    });
  });

  describe("when mode is FormMode.VIEW", () => {
    it("renders the NoteSection", () => {
      renderFormFields(FormMode.VIEW);
      expect(screen.getByTestId("note-section")).toBeInTheDocument();
    });

    it("renders the AttachmentSection", () => {
      renderFormFields(FormMode.VIEW);
      expect(screen.getByTestId("attachment-section")).toBeInTheDocument();
    });

    it("renders the LinkedItemsSection", () => {
      renderFormFields(FormMode.VIEW);
      expect(screen.getByTestId("linked-items-section")).toBeInTheDocument();
    });
  });
});

describe("FormFields — loading state", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders spinner on first load (loading=true, never loaded before)", () => {
    render(<FormFields {...baseProps} mode={FormMode.EDIT} loading={true} />);
    // Spinner is rendered; sections are not
    expect(screen.queryByTestId("note-section")).not.toBeInTheDocument();
  });
});

describe("FormFields — expression evaluation context", () => {
  // The module mock returns a new object per call; here it returns the same one, like the hook between
  // edits of unrelated fields, so the mount re-render (setHasLoadedOnce) reuses the context.
  const stableFormValues = { a: "Y" };
  beforeEach(() => {
    jest.clearAllMocks();
    (useDisplayLogicFormValues as jest.Mock).mockReturnValue(stableFormValues);
  });
  // clearAllMocks keeps implementations: restore the module mocks' defaults so overrides don't leak.
  afterEach(() => {
    (useDisplayLogicFormValues as jest.Mock).mockReset().mockImplementation(() => ({}));
    (createSmartContext as jest.Mock).mockReset().mockImplementation(() => ({}));
  });

  const withLogic = (hqlName: string) => makeField({ hqlName, displayLogicExpression: "@a@ = 'Y'" } as any);
  const groups = [
    ["main", { identifier: "Main", fields: { f1: withLogic("f1"), f2: withLogic("f2") } }],
    ["more", { identifier: "More", fields: { f3: withLogic("f3"), f4: withLogic("f4") } }],
  ] as typeof baseProps.groups;

  it("builds the evaluation context once per render, not once per section", () => {
    render(<FormFields {...baseProps} groups={groups} mode={FormMode.EDIT} />);
    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
    expect(createSmartContext).toHaveBeenCalledTimes(1);
  });

  it("follows the display-logic fields of the tab and the record identifier", () => {
    render(<FormFields {...baseProps} groups={groups} mode={FormMode.EDIT} />);
    expect(useDisplayLogicFormValues).toHaveBeenCalledWith(baseProps.tab.fields, ["_identifier"]);
  });

  it("still shows the sections when the context build throws", () => {
    (createSmartContext as jest.Mock).mockImplementation(() => {
      throw new Error("boom");
    });
    render(<FormFields {...baseProps} groups={groups} mode={FormMode.EDIT} />);
    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
  });
});
