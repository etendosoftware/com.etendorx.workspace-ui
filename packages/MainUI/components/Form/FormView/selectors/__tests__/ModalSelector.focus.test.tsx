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

import type React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { ModalSelector } from "../ModalSelector";

jest.mock("@/hooks/datasource/useTableDirDatasource", () => ({
  useTableDirDatasource: () => ({ records: [], loading: false, refetch: jest.fn(), columns: [] }),
}));

jest.mock("material-react-table", () => ({
  MaterialReactTable: () => null,
  useMaterialReactTable: () => ({}),
}));

jest.mock("@workspaceui/componentlibrary/src/components/BasicModal", () => ({
  __esModule: true,
  default: () => null,
}));

const FIELD = { id: "pa", hqlName: "partnerAddress", name: "Partner Address" } as unknown as Field;
const FOCUS_TOKEN_CLASSES = [
  "bg-(--ui-field-focus-bg)",
  "text-(--ui-field-focus-fg)",
  "border-(--ui-field-focus-border)",
];

function Harness({ children }: { children: React.ReactNode }) {
  const methods = useForm({ defaultValues: { partnerAddress: "A1", partnerAddress$_identifier: "Main street" } });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe("ModalSelector focus style", () => {
  it("uses the theme focus tokens while the field is focused, so it stays readable in dark mode", () => {
    render(
      <Harness>
        <ModalSelector field={FIELD} isReadOnly={false} />
      </Harness>
    );
    const trigger = screen.getByLabelText(`Select ${FIELD.name}`);

    fireEvent.focus(trigger);

    expect(trigger).toHaveClass(...FOCUS_TOKEN_CLASSES);
    expect(screen.getByText("Main street")).toHaveClass("text-(--ui-field-focus-fg)");
  });
});
