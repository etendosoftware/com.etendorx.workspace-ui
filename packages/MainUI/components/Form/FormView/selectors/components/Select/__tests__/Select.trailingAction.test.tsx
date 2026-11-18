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

import { fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import Select from "../Select";
import { FieldTrailingActionContext } from "../FieldTrailingAction";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const FIELD_NAME = "businessPartner";
const FIELD_LABEL = "Business Partner";
const ACTION_TEST_ID = "field-action";

const FIELD = {
  id: "bp",
  hqlName: FIELD_NAME,
  name: FIELD_LABEL,
  isMandatory: false,
  helpComment: "",
} as unknown as Field;

/** Stable context value: defined once, so the provider does not change on every render. */
const TRAILING_ACTION = { action: <button type="button" data-testid={ACTION_TEST_ID} />, setHosted: jest.fn() };

function Harness() {
  const methods = useForm({ defaultValues: { [FIELD_NAME]: "HF" } });
  return (
    <FormProvider {...methods}>
      <FieldTrailingActionContext.Provider value={TRAILING_ACTION}>
        <Select name={FIELD_NAME} options={[{ id: "HF", label: "Healthy Food" }]} isReadOnly={false} field={FIELD} />
      </FieldTrailingActionContext.Provider>
    </FormProvider>
  );
}

describe("Select field action", () => {
  it("shows the action inside the field box", () => {
    render(<Harness />);

    const trigger = screen.getByLabelText(FIELD_LABEL).querySelector("[tabindex='0']") as HTMLElement;
    expect(trigger).toContainElement(screen.getByTestId(ACTION_TEST_ID));
  });

  it("keeps the action after the clear icon, so the icon appearing on hover does not move it", () => {
    render(<Harness />);
    const trigger = screen.getByLabelText(FIELD_LABEL).querySelector("[tabindex='0']") as HTMLElement;

    fireEvent.mouseEnter(trigger);

    const clear = screen.getByLabelText("Clear selection");
    const action = screen.getByTestId(ACTION_TEST_ID);
    expect(clear.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
