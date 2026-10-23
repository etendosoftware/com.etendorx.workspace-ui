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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import type React from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import type { Field, Tab } from "@workspaceui/api-client/src/api/types";
import type { OpenProcessParams } from "@/utils/processes/definition/scriptProxies";
import ProcessSelectorActions from "../ProcessSelectorActions";

// The shared IconButton mock drops onClick; this one keeps it and the test id.
jest.mock("@workspaceui/componentlibrary/src/components/IconButton", () => ({
  __esModule: true,
  default: ({
    onClick,
    children,
    "data-testid": testId,
  }: {
    onClick?: () => void;
    children?: React.ReactNode;
    "data-testid"?: string;
  }) => (
    <button type="button" data-testid={testId} onClick={onClick}>
      {children}
    </button>
  ),
}));
jest.mock("@/utils/form/keyboard", () => ({
  getSelectorPopupShortcutId: () => "Selector_ShowPopup",
  isSelectorPopupShortcut: (event: React.KeyboardEvent) => event.ctrlKey && event.key === "Enter",
  isEventFromDropdownPortal: () => false,
}));
// The popup renders what it receives and picks PICKED_RECORD on demand.
jest.mock("@/components/Form/FormView/selectors/SelectorModal", () => ({
  __esModule: true,
  default: ({
    onSelect,
    currentTab,
    extraParams,
  }: {
    onSelect: (record: Record<string, unknown>) => void;
    currentTab?: { id: string } | null;
    extraParams?: Record<string, unknown>;
  }) => (
    <div data-testid="selector-modal" data-tab={currentTab?.id ?? ""} data-params={JSON.stringify(extraParams ?? {})}>
      <button type="button" onClick={() => onSelect({ id: "ROW-1", paymentId: PAYMENT_ID, _identifier: "Pay 1" })}>
        pick
      </button>
    </div>
  ),
}));

const FIELD_ID = "F-PAYMENT";
const FIELD_NAME = "Payment";
const PROCESS_ID = "E68790A7B65F4D45AB35E2BAE34C1F39";
const ADD_PROCESS_ID = "9BED7889E1034FE68BD85D5D16857320";
const PAYMENT_ID = "PAY-1";
const SEARCH_BUTTON = `ProcessSelectorSearch__${FIELD_ID}`;
const ADD_BUTTON = `ProcessSelectorAdd__${FIELD_ID}`;
const PROCESS_CONTEXT = { processId: PROCESS_ID, values: { trxtype: "BPW", fin_payment_id: "" } };

const buildField = (selector: Record<string, unknown>): Field =>
  ({
    id: FIELD_ID,
    name: FIELD_NAME,
    hqlName: FIELD_NAME,
    columnName: "fin_payment_id",
    column: { reference: "95E2A8B50A254B2AAE6774B8C2F28120" },
    selector,
  }) as unknown as Field;

const SEARCH_AND_ADD = {
  hasTableRelated: true,
  hasProcessDefinitionRelated: true,
  processDefinitionId: ADD_PROCESS_ID,
  valueField: "paymentId",
};

/** Exposes the form values the buttons write. */
const FormProbe = () => {
  const values = useWatch();
  return <span data-testid="probe">{JSON.stringify(values)}</span>;
};

const readValues = (): Record<string, unknown> => JSON.parse(screen.getByTestId("probe").textContent || "{}");

interface RenderOptions {
  selector?: Record<string, unknown>;
  isReadOnly?: boolean;
  onOpenProcess?: (params: OpenProcessParams) => void;
}

const renderActions = (options: RenderOptions = {}) => {
  const { selector = SEARCH_AND_ADD, isReadOnly = false } = options;
  // An explicit `onOpenProcess: undefined` means "no launcher".
  const onOpenProcess = "onOpenProcess" in options ? options.onOpenProcess : jest.fn();
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const methods = useForm();
    return (
      <FormProvider {...methods}>
        {children}
        <FormProbe />
      </FormProvider>
    );
  };
  render(
    <Wrapper>
      <ProcessSelectorActions
        field={buildField(selector)}
        isReadOnly={isReadOnly}
        currentTab={{ id: "TAB-1" } as Tab}
        processContext={PROCESS_CONTEXT}
        onOpenProcess={onOpenProcess}>
        <select data-testid="combo" />
      </ProcessSelectorActions>
    </Wrapper>
  );
};

describe("ProcessSelectorActions", () => {
  it("shows the search and add buttons next to the selector when its metadata has a grid and a process", () => {
    renderActions();

    expect(screen.getByTestId("combo")).toBeInTheDocument();
    expect(screen.getByTestId(SEARCH_BUTTON)).toBeInTheDocument();
    expect(screen.getByTestId(ADD_BUTTON)).toBeInTheDocument();
  });

  it("renders only the selector when the metadata has neither a grid nor a process", () => {
    renderActions({ selector: {} });

    expect(screen.getByTestId("combo")).toBeInTheDocument();
    expect(screen.queryByTestId(SEARCH_BUTTON)).not.toBeInTheDocument();
    expect(screen.queryByTestId(ADD_BUTTON)).not.toBeInTheDocument();
  });

  it("hides both buttons on a read-only parameter", () => {
    renderActions({ isReadOnly: true });

    expect(screen.queryByTestId(SEARCH_BUTTON)).not.toBeInTheDocument();
    expect(screen.queryByTestId(ADD_BUTTON)).not.toBeInTheDocument();
  });

  it("opens the search popup with the tab and the process context the combo sends", () => {
    renderActions();

    fireEvent.click(screen.getByTestId(SEARCH_BUTTON));

    const modal = screen.getByTestId("selector-modal");
    expect(modal).toHaveAttribute("data-tab", "TAB-1");
    expect(JSON.parse(modal.getAttribute("data-params") ?? "{}")).toEqual(
      expect.objectContaining({ trxtype: "BPW", _processDefinitionId: PROCESS_ID, _selectorFieldId: FIELD_ID })
    );
  });

  it("writes the record picked in the popup, resolving its id through the selector valueField", async () => {
    renderActions();

    fireEvent.click(screen.getByTestId(SEARCH_BUTTON));
    // The write validates the field asynchronously: let it settle inside act.
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "pick" })));

    expect(readValues()).toEqual(expect.objectContaining({ [FIELD_NAME]: PAYMENT_ID }));
  });

  it("opens the search popup with Ctrl+Enter", () => {
    renderActions();

    fireEvent.keyDown(screen.getByTestId("combo"), { key: "Enter", ctrlKey: true });

    expect(screen.getByTestId("selector-modal")).toBeInTheDocument();
  });

  it("opens the selector process with this process' values, and writes back the record it creates", async () => {
    const onOpenProcess = jest.fn();
    renderActions({ onOpenProcess });

    fireEvent.click(screen.getByTestId(ADD_BUTTON));

    const params = onOpenProcess.mock.calls[0][0] as OpenProcessParams;
    expect(params).toEqual(
      expect.objectContaining({
        processId: ADD_PROCESS_ID,
        callerContext: PROCESS_CONTEXT.values,
        callerField: expect.objectContaining({ id: FIELD_ID, name: FIELD_NAME }),
      })
    );
    await act(async () => params.callerField?.setValueFromRecord?.({ value: PAYMENT_ID, map: "Payment 1" }));
    expect(readValues()).toEqual(
      expect.objectContaining({ [FIELD_NAME]: PAYMENT_ID, [`${FIELD_NAME}$_identifier`]: "Payment 1" })
    );
  });

  it("hides the add button when there is no process launcher", () => {
    renderActions({ onOpenProcess: undefined });

    expect(screen.queryByTestId(ADD_BUTTON)).not.toBeInTheDocument();
  });
});
