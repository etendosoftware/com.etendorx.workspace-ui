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

import { fireEvent, render, screen } from "@testing-library/react";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { Switch } from "../Switch";
import { findFocusableFields } from "@/utils/form/focus";

const FIELD_LABEL = "Active";
const SPACE_KEY = " ";

const buildField = (): Field =>
  ({
    id: "field-1",
    hqlName: "active",
    name: FIELD_LABEL,
    isMandatory: false,
    helpComment: "",
  }) as unknown as Field;

const renderSwitch = ({ checked = false, disabled = false } = {}) => {
  const onCheckedChange = jest.fn();
  const view = render(
    <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} field={buildField()} />
  );
  return { ...view, onCheckedChange, control: screen.getByRole("switch") };
};

describe("Switch keyboard contract", () => {
  // Mirrors isc.CycleItem.handleKeyPress of Etendo Classic: Space advances the value.
  it("toggles with Space", () => {
    const { control, onCheckedChange } = renderSwitch({ checked: false });

    fireEvent.keyDown(control, { key: SPACE_KEY });

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("toggles back to false with Space when checked", () => {
    const { control, onCheckedChange } = renderSwitch({ checked: true });

    fireEvent.keyDown(control, { key: SPACE_KEY });

    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it("cancels the default of Space so the page does not scroll and the value flips once", () => {
    const { control } = renderSwitch();

    const wasHandled = !fireEvent.keyDown(control, { key: SPACE_KEY });

    expect(wasHandled).toBe(true);
  });

  it("ignores Space while the field is read-only", () => {
    const { control, onCheckedChange } = renderSwitch({ disabled: true });

    fireEvent.keyDown(control, { key: SPACE_KEY });

    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("leaves other keys alone, so Tab keeps moving the focus", () => {
    const { control, onCheckedChange } = renderSwitch();

    fireEvent.keyDown(control, { key: "Tab" });

    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("is a single tab stop when editable and none when read-only", () => {
    const { container, unmount } = renderSwitch();
    expect(findFocusableFields(container)).toHaveLength(1);
    unmount();

    const readOnly = renderSwitch({ disabled: true });
    expect(findFocusableFields(readOnly.container)).toHaveLength(0);
  });

  // focus:outline-none with a colourless ring left the focused state invisible.
  it("paints a visible focus ring", () => {
    const { control } = renderSwitch();

    expect(control.className).toContain("focus-visible:ring-[#004ACA]");
  });
});
