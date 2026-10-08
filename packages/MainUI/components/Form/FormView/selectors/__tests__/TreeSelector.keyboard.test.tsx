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
import { FormProvider, useForm } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import TreeSelector from "../TreeSelector";
import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@/hooks/datasource/useTableDirDatasource", () => ({
  useTableDirDatasource: () => ({ records: [], loading: false, refetch: jest.fn() }),
}));
jest.mock("@/hooks/useSelectFieldOptions", () => ({
  useSelectFieldOptions: () => [],
}));

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = jest.fn();
}

const FIELD_NAME = "characteristicValue";
const FIELD_LABEL = "Characteristic Value";

const buildField = (): Field =>
  ({ id: "field-1", hqlName: FIELD_NAME, name: FIELD_LABEL, isMandatory: false, helpComment: "" }) as unknown as Field;

function Harness({ isReadOnly = false }: { isReadOnly?: boolean }) {
  const methods = useForm({ defaultValues: { [FIELD_NAME]: "" } });
  return (
    <FormProvider {...methods}>
      <TreeSelector field={buildField()} isReadOnly={isReadOnly} />
    </FormProvider>
  );
}

const getTrigger = () => screen.getByLabelText(FIELD_LABEL).querySelector("[tabindex='0']") as HTMLElement;
const getSearchInput = () => document.querySelector("[data-dropdown-portal] input") as HTMLInputElement | null;

describe("TreeSelector keyboard shortcuts", () => {
  beforeEach(() => installLocalStorageMock());

  it("opens the tree with Alt+Down", () => {
    render(<Harness />);

    fireEvent.keyDown(getTrigger(), { key: "ArrowDown", altKey: true });

    expect(getSearchInput()).not.toBeNull();
  });

  it("moves the keyboard into the open tree with Down", () => {
    render(<Harness />);
    fireEvent.keyDown(getTrigger(), { key: "ArrowDown", altKey: true });
    getTrigger().focus();

    fireEvent.keyDown(getTrigger(), { key: "ArrowDown" });

    expect(document.activeElement).toBe(getSearchInput());
  });

  it("keeps Down inert while the tree is closed", () => {
    render(<Harness />);

    fireEvent.keyDown(getTrigger(), { key: "ArrowDown" });

    expect(getSearchInput()).toBeNull();
  });

  it("still toggles the tree with Enter", () => {
    render(<Harness />);

    fireEvent.keyDown(getTrigger(), { key: "Enter" });

    expect(getSearchInput()).not.toBeNull();
  });
});
