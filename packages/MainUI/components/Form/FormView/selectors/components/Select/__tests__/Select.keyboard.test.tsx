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

import { act, fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import Select from "../Select";
import { FORM_FIELDS_ROOT_ATTRIBUTE, FORM_FIELD_NAME_ATTRIBUTE } from "@/utils/form/focus";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// jsdom doesn't implement scrollIntoView; the Select calls it to keep the
// highlighted option in view.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = jest.fn();
}

const FIELD_NAME = "documentStatus";

const TEST_IDS = {
  PREVIOUS_FIELD: "previous-field",
  NEXT_FIELD: "next-field",
  TRIGGER: "select-trigger",
  SEARCH: "select-search",
} as const;

const OPTIONS = [
  { id: "DR", label: "Draft" },
  { id: "CO", label: "Completed" },
];

const buildField = (): Field =>
  ({
    id: "field-1",
    hqlName: FIELD_NAME,
    name: "Document Status",
    isMandatory: false,
    helpComment: "",
  }) as unknown as Field;

interface HarnessProps {
  onFocus?: () => void;
  /** Renders the select outside a form-fields root, as the process modal does. */
  standalone?: boolean;
}

/**
 * Renders the select between two plain fields inside a form-fields root, which is
 * the arrangement Tab navigation is defined against.
 */
function Harness({ onFocus, standalone = false }: HarnessProps) {
  const methods = useForm({ defaultValues: { [FIELD_NAME]: "" } });
  const rootAttributes = standalone ? {} : { [FORM_FIELDS_ROOT_ATTRIBUTE]: "" };

  return (
    <FormProvider {...methods}>
      <div {...rootAttributes}>
        <div {...{ [FORM_FIELD_NAME_ATTRIBUTE]: "previous" }}>
          <input data-testid={TEST_IDS.PREVIOUS_FIELD} />
        </div>
        <div {...{ [FORM_FIELD_NAME_ATTRIBUTE]: FIELD_NAME }}>
          <Select name={FIELD_NAME} options={OPTIONS} isReadOnly={false} field={buildField()} onFocus={onFocus} />
        </div>
        <div {...{ [FORM_FIELD_NAME_ATTRIBUTE]: "next" }}>
          <input data-testid={TEST_IDS.NEXT_FIELD} />
        </div>
      </div>
    </FormProvider>
  );
}

const getTrigger = () => screen.getByLabelText("Document Status").querySelector("[tabindex='0']") as HTMLElement;

const getSearchInput = () => document.querySelector("[data-dropdown-portal] input") as HTMLInputElement;

const openDropdown = () => {
  act(() => {
    fireEvent.click(getTrigger());
  });
  act(() => {
    jest.advanceTimersByTime(10);
  });
};

const pressKeyOnSearch = (key: string, options: { shiftKey?: boolean } = {}) => {
  act(() => {
    fireEvent.keyDown(getSearchInput(), { key, ...options });
  });
};

describe("Select keyboard navigation", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps the focus on the field after picking an option with the mouse", () => {
    render(<Harness />);
    openDropdown();

    act(() => {
      fireEvent.click(screen.getByTestId("OptionItem__CO"));
    });

    expect(document.activeElement).toBe(getTrigger());
  });

  it("keeps the focus on the field after picking an option with Enter", () => {
    render(<Harness />);
    openDropdown();

    pressKeyOnSearch("ArrowDown");
    pressKeyOnSearch("Enter");

    expect(document.activeElement).toBe(getTrigger());
  });

  it("does not refetch the options when the focus is restored programmatically", () => {
    const onFocus = jest.fn();
    render(<Harness onFocus={onFocus} />);
    openDropdown();
    onFocus.mockClear();

    act(() => {
      fireEvent.click(screen.getByTestId("OptionItem__DR"));
    });

    expect(onFocus).not.toHaveBeenCalled();
  });

  it("commits the highlighted option and moves to the next field on Tab", () => {
    render(<Harness />);
    openDropdown();

    pressKeyOnSearch("ArrowDown");
    pressKeyOnSearch("Tab");

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByTestId(TEST_IDS.NEXT_FIELD));
  });

  it("moves to the previous field on Shift+Tab", () => {
    render(<Harness />);
    openDropdown();

    pressKeyOnSearch("Tab", { shiftKey: true });

    expect(document.activeElement).toBe(screen.getByTestId(TEST_IDS.PREVIOUS_FIELD));
  });

  it("returns the focus to the field when there is no surrounding form", () => {
    render(<Harness standalone />);
    openDropdown();

    pressKeyOnSearch("Tab");

    expect(document.activeElement).toBe(getTrigger());
  });
});
