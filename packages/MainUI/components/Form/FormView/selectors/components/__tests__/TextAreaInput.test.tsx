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

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { TextAreaInput } from "../TextAreaInput";

const baseField: Field = {
  hqlName: "description",
  inputName: "inpDescription",
  columnName: "DESCRIPTION",
  id: "field-1",
  name: "Description",
  isMandatory: false,
  column: { reference: "14" },
  process: "",
  shownInStatusBar: false,
  tab: "",
  displayed: true,
  startnewline: false,
  showInGridView: false,
  fieldGroup$_identifier: "",
  fieldGroup: "",
  module: "",
  hasDefaultValue: false,
  refColumnName: "",
  targetEntity: "",
  gridProps: {
    sort: 0,
    autoExpand: false,
    editorProps: { displayField: "", valueField: "" },
    displaylength: 0,
    fkField: false,
    selectOnClick: false,
    canSort: false,
    canFilter: false,
    showHover: false,
    filterEditorProperties: { keyProperty: "" },
    showIf: "",
  },
  type: "text",
  field: [],
  refList: [],
  referencedEntity: "",
  referencedWindowId: "",
  referencedTabId: "",
  isReadOnly: false,
  isDisplayed: true,
  sequenceNumber: 0,
  isUpdatable: true,
  description: "",
  helpComment: "",
  isActive: true,
  gridDisplayLogic: "",
};

const fieldWithLength = (length: string): Field => ({
  ...baseField,
  column: { ...baseField.column, length },
});

describe("TextAreaInput — character counter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render counter when field has no length defined", () => {
    render(<TextAreaInput field={baseField} value="" />);
    expect(screen.queryByTestId("char-counter")).not.toBeInTheDocument();
  });

  it("does not render counter when field column length is '0'", () => {
    render(<TextAreaInput field={fieldWithLength("0")} value="" />);
    expect(screen.queryByTestId("char-counter")).not.toBeInTheDocument();
  });

  it("does not render counter when field column length is a non-numeric string", () => {
    render(<TextAreaInput field={fieldWithLength("abc")} value="" />);
    expect(screen.queryByTestId("char-counter")).not.toBeInTheDocument();
  });

  it("renders counter with correct initial value when length is defined", () => {
    render(<TextAreaInput field={fieldWithLength("255")} value="" />);
    expect(screen.getByTestId("char-counter")).toBeInTheDocument();
    expect(screen.getByTestId("char-counter")).toHaveTextContent("0 / 255");
  });

  it("shows current character count in counter", () => {
    render(<TextAreaInput field={fieldWithLength("255")} value="hello" />);
    expect(screen.getByTestId("char-counter")).toHaveTextContent("5 / 255");
  });

  it("counter updates in real time as user types", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    const { rerender } = render(<TextAreaInput field={fieldWithLength("255")} value="" onChange={handleChange} />);

    expect(screen.getByTestId("char-counter")).toHaveTextContent("0 / 255");

    rerender(<TextAreaInput field={fieldWithLength("255")} value="hello" onChange={handleChange} />);
    expect(screen.getByTestId("char-counter")).toHaveTextContent("5 / 255");
  });

  it("counter uses neutral color class when usage is below 80%", () => {
    // 10 chars out of 255 = ~3.9%
    render(<TextAreaInput field={fieldWithLength("255")} value={"a".repeat(10)} />);
    const counter = screen.getByTestId("char-counter");
    expect(counter.className).toContain("text-(--color-baseline-60)");
    expect(counter.className).not.toContain("text-orange-400");
    expect(counter.className).not.toContain("text-red-500");
  });

  it("counter uses orange color class when usage is above 80%", () => {
    // 210 chars out of 255 = ~82.4%
    render(<TextAreaInput field={fieldWithLength("255")} value={"a".repeat(210)} />);
    const counter = screen.getByTestId("char-counter");
    expect(counter.className).toContain("text-orange-400");
    expect(counter.className).not.toContain("text-red-500");
  });

  it("counter uses red color class when usage is at 100%", () => {
    // 255 chars out of 255 = 100%
    render(<TextAreaInput field={fieldWithLength("255")} value={"a".repeat(255)} />);
    const counter = screen.getByTestId("char-counter");
    expect(counter.className).toContain("text-red-500");
    expect(counter.className).not.toContain("text-orange-400");
  });

  it("does not render counter when field is disabled", () => {
    render(<TextAreaInput field={fieldWithLength("255")} value="some text" disabled={true} />);
    expect(screen.queryByTestId("char-counter")).not.toBeInTheDocument();
  });

  it("does not render counter when field is readOnly", () => {
    render(<TextAreaInput field={fieldWithLength("255")} value="some text" readOnly={true} />);
    expect(screen.queryByTestId("char-counter")).not.toBeInTheDocument();
  });

  it("textarea has maxLength attribute set to field column length", () => {
    render(<TextAreaInput field={fieldWithLength("255")} value="" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("maxLength", "255");
  });

  it("textarea does not have maxLength attribute when field has no length", () => {
    render(<TextAreaInput field={baseField} value="" />);
    const textarea = screen.getByRole("textbox");
    expect(textarea).not.toHaveAttribute("maxLength");
  });

  it("counter at exactly 80% usage uses neutral color (boundary: > 0.8 needed)", () => {
    // exactly 80% = ratio of 0.8 which is NOT > 0.8, so stays neutral
    // 204 out of 255 = 80% exactly
    render(<TextAreaInput field={fieldWithLength("255")} value={"a".repeat(204)} />);
    const counter = screen.getByTestId("char-counter");
    expect(counter.className).toContain("text-(--color-baseline-60)");
  });

  it("renders counter when field is neither disabled nor readOnly", () => {
    render(<TextAreaInput field={fieldWithLength("255")} value="test" disabled={false} readOnly={false} />);
    expect(screen.getByTestId("char-counter")).toBeInTheDocument();
  });
});
