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

import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { useFormInitialFocus } from "@/hooks/useFormInitialFocus";
import { FORM_FIELDS_ROOT_ATTRIBUTE, FORM_FIELD_NAME_ATTRIBUTE } from "@/utils/form/focus";

const FIELD_NAMES = {
  DOCUMENT_NO: "documentNo",
  BUSINESS_PARTNER: "businessPartner",
} as const;

const TEST_IDS = {
  DOCUMENT_NO: "documentNo-input",
  BUSINESS_PARTNER: "businessPartner-input",
  OUTSIDE: "outside-input",
  SECTION_ICON: "section-icon",
} as const;

const DEFAULT_FOCUS_KEY = "0:record-1:EDIT";

interface HarnessProps {
  enabled?: boolean;
  isReady?: boolean;
  focusKey?: string;
  layoutToken?: string;
  firstFocusedFieldName?: string;
  /** Renders every field as read-only, so nothing can take the focus. */
  allReadOnly?: boolean;
  /** Reproduces a form whose sections have not been expanded yet. */
  collapsed?: boolean;
}

/**
 * Reproduces the structure of `FormFieldsContent`: a marked fields root holding
 * field wrappers, plus a control rendered outside it (as the toolbar would be).
 */
function Harness({
  enabled = true,
  isReady = true,
  focusKey = DEFAULT_FOCUS_KEY,
  layoutToken = "",
  firstFocusedFieldName,
  allReadOnly = false,
  collapsed = false,
}: HarnessProps) {
  const fieldsRootRef = useRef<HTMLDivElement | null>(null);

  useFormInitialFocus({ fieldsRootRef, enabled, isReady, focusKey, layoutToken, firstFocusedFieldName });

  return (
    <div>
      <input data-testid={TEST_IDS.OUTSIDE} />
      <div ref={fieldsRootRef} {...{ [FORM_FIELDS_ROOT_ATTRIBUTE]: "" }}>
        {/* Section header, whose decorative icons precede every field in the DOM. */}
        <button type="button" data-testid={TEST_IDS.SECTION_ICON}>
          section icon
        </button>
        {/* Mirrors Collapsible: a collapsed section hides its content from the tab sequence. */}
        <div aria-hidden={collapsed}>
          <div {...{ [FORM_FIELD_NAME_ATTRIBUTE]: FIELD_NAMES.DOCUMENT_NO }}>
            <input data-testid={TEST_IDS.DOCUMENT_NO} disabled={allReadOnly} />
          </div>
          <div {...{ [FORM_FIELD_NAME_ATTRIBUTE]: FIELD_NAMES.BUSINESS_PARTNER }}>
            <input data-testid={TEST_IDS.BUSINESS_PARTNER} disabled={allReadOnly} />
          </div>
        </div>
      </div>
    </div>
  );
}

const renderHarness = (props: HarnessProps = {}) => {
  const view = render(<Harness {...props} />);
  const rerenderWith = (next: HarnessProps) => view.rerender(<Harness {...props} {...next} />);
  return { ...view, rerenderWith };
};

/** Lets the deferred focus run. */
const flushFocus = () => {
  act(() => {
    jest.runAllTimers();
  });
};

const activeTestId = () => document.activeElement?.getAttribute("data-testid");

describe("useFormInitialFocus", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // The section header precedes the fields in the DOM, so this also pins down that
  // the focus goes to a field and not to the chrome of the section.
  it("focuses the first editable field once the form is ready", () => {
    renderHarness();

    flushFocus();

    expect(activeTestId()).toBe(TEST_IDS.DOCUMENT_NO);
  });

  it("focuses the field flagged as the entry point in the dictionary", () => {
    renderHarness({ firstFocusedFieldName: FIELD_NAMES.BUSINESS_PARTNER });

    flushFocus();

    expect(activeTestId()).toBe(TEST_IDS.BUSINESS_PARTNER);
  });

  it("does not take the focus while the form does not own the keyboard", () => {
    renderHarness({ enabled: false });

    flushFocus();

    expect(activeTestId()).not.toBe(TEST_IDS.DOCUMENT_NO);
  });

  it("waits for the form data before taking the focus", () => {
    const { rerenderWith } = renderHarness({ isReady: false });

    flushFocus();
    expect(activeTestId()).not.toBe(TEST_IDS.DOCUMENT_NO);

    rerenderWith({ isReady: true });
    flushFocus();

    expect(activeTestId()).toBe(TEST_IDS.DOCUMENT_NO);
  });

  it("never pulls the caret out of a field the user is already in", () => {
    const { getByTestId, rerenderWith } = renderHarness();
    flushFocus();

    act(() => {
      getByTestId(TEST_IDS.BUSINESS_PARTNER).focus();
    });
    rerenderWith({ focusKey: "1:record-2:EDIT" });
    flushFocus();

    expect(activeTestId()).toBe(TEST_IDS.BUSINESS_PARTNER);
  });

  it("focuses again when another record is opened", () => {
    const { getByTestId, rerenderWith } = renderHarness();
    flushFocus();

    act(() => {
      getByTestId(TEST_IDS.OUTSIDE).focus();
    });
    rerenderWith({ focusKey: "1:record-2:EDIT" });
    flushFocus();

    expect(activeTestId()).toBe(TEST_IDS.DOCUMENT_NO);
  });

  it("leaves the focus alone on a data refresh of the same record", () => {
    const { getByTestId, rerenderWith } = renderHarness();
    flushFocus();

    act(() => {
      getByTestId(TEST_IDS.OUTSIDE).focus();
    });
    rerenderWith({ isReady: true });
    flushFocus();

    expect(activeTestId()).toBe(TEST_IDS.OUTSIDE);
  });

  it("does nothing when the whole form is read-only", () => {
    renderHarness({ allReadOnly: true });

    flushFocus();

    expect(activeTestId()).not.toBe(TEST_IDS.DOCUMENT_NO);
  });

  // The sections of a form start collapsed: the expansion preference is only
  // seeded once the metadata arrives, so the first attempt finds no field at all.
  it("retries once the sections stop being collapsed", () => {
    const { rerenderWith } = renderHarness({ collapsed: true });

    flushFocus();
    expect(activeTestId()).not.toBe(TEST_IDS.DOCUMENT_NO);

    rerenderWith({ collapsed: false, layoutToken: "_main" });
    flushFocus();

    expect(activeTestId()).toBe(TEST_IDS.DOCUMENT_NO);
  });
});
