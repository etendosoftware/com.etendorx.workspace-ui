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

import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { ProductCharacteristicsSelector } from "../ProductCharacteristicsSelector";

jest.mock("../StringSelector", () => ({
  StringSelector: ({ field, readOnly }: { field: Field; readOnly: boolean }) => (
    <input data-testid="string-selector" data-readonly={String(readOnly)} name={field.hqlName} />
  ),
}));

const STRING_SELECTOR = "string-selector";
const FIELD_NAME = "characteristicDescription";
const field = { id: "field-1", hqlName: FIELD_NAME, name: "Characteristic Description" } as unknown as Field;

function Harness({ values }: { values: Record<string, unknown> }) {
  const methods = useForm({ defaultValues: values });
  return (
    <FormProvider {...methods}>
      <ProductCharacteristicsSelector field={field} />
    </FormProvider>
  );
}

describe("ProductCharacteristicsSelector", () => {
  it("shows one line per characteristic, as Classic", () => {
    render(
      <Harness
        values={{
          [FIELD_NAME]: "Envase: Vidrio, Formato: 330 ml",
          [`${FIELD_NAME}$_characteristics`]: { Envase: "Botella / Vidrio", Formato: "330 ml" },
        }}
      />
    );

    expect(screen.getByText("Envase")).toBeInTheDocument();
    expect(screen.getByText("Botella / Vidrio")).toBeInTheDocument();
    expect(screen.getByText("Formato")).toBeInTheDocument();
    expect(screen.getByText("330 ml")).toBeInTheDocument();
    expect(screen.queryByTestId(STRING_SELECTOR)).toBeNull();
  });

  it("shows the stored text, read-only, without characteristics", () => {
    render(<Harness values={{ [FIELD_NAME]: "Envase: Vidrio" }} />);

    expect(screen.getByTestId(STRING_SELECTOR)).toHaveAttribute("data-readonly", "true");
  });
});
