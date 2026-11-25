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

/** Harness shared by the tests of the `Select` dropdown: a form around it and the interactions with its search. */
import { act, fireEvent, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import Select from "../components/Select/Select";
import type { SelectProps } from "../components/types";

export const SELECT_FIELD_NAME = "businessPartner";
const SELECT_FIELD_LABEL = "Business Partner";

export const SELECT_OPTIONS = [
  { id: "1", label: "Alpha Corp" },
  { id: "2", label: "Alpine SA" },
];

export const selectField = {
  id: "field-1",
  hqlName: SELECT_FIELD_NAME,
  name: SELECT_FIELD_LABEL,
  isMandatory: false,
  helpComment: "",
} as unknown as Field;

/** A `Select` of the business partner field, with the given props over the defaults. */
export function SelectHarness(props: Partial<SelectProps>) {
  const methods = useForm({ defaultValues: { [SELECT_FIELD_NAME]: "" } });
  return (
    <FormProvider {...methods}>
      <Select name={SELECT_FIELD_NAME} options={SELECT_OPTIONS} isReadOnly={false} field={selectField} {...props} />
    </FormProvider>
  );
}

export const getSelectSearchInput = () => document.querySelector("[data-dropdown-portal] input") as HTMLInputElement;

/** Opens the dropdown; needs fake timers, for the focus of the search input. */
export const openSelectDropdown = () => {
  act(() => {
    fireEvent.click(screen.getByLabelText(SELECT_FIELD_LABEL).querySelector("[tabindex='0']") as HTMLElement);
  });
  act(() => {
    jest.advanceTimersByTime(10);
  });
};

export const typeInSelectSearch = (value: string) => {
  act(() => {
    fireEvent.change(getSelectSearchInput(), { target: { value } });
  });
};
