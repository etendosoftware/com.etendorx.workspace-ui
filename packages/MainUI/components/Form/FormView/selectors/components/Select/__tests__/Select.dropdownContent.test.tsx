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

/**
 * DropdownPortal measures its placement again whenever the content it receives changes. If Select built a new
 * element on every render, that measurement (a layout effect that sets state) ran on every render and the
 * Client window crashed with "Maximum update depth exceeded". The content must keep its identity while the
 * options, columns and threshold hint stay the same.
 */
import { render } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import type { Field } from "@workspaceui/api-client/src/api/types";
import Select from "../Select";

const mockContents: unknown[] = [];

jest.mock("../DropdownPortal", () => ({
  __esModule: true,
  default: (props: { renderedOptions: unknown }) => {
    mockContents.push(props.renderedOptions);
    return null;
  },
}));

jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const FIELD_NAME = "businessPartner";
const OPTIONS = [
  { id: "1", label: "Alpha Corp" },
  { id: "2", label: "Alpine SA" },
];
const COLUMNS = [{ accessorKey: "name", header: "Name" }];

const field = {
  id: "field-1",
  hqlName: FIELD_NAME,
  name: "Business Partner",
  isMandatory: false,
  helpComment: "",
} as unknown as Field;

function Harness({ label }: { label: string }) {
  const methods = useForm({ defaultValues: { [FIELD_NAME]: "" } });
  return (
    <FormProvider {...methods}>
      <span>{label}</span>
      <Select name={FIELD_NAME} options={OPTIONS} columns={COLUMNS} isReadOnly={false} field={field} />
    </FormProvider>
  );
}

describe("Select dropdown content", () => {
  beforeEach(() => {
    mockContents.length = 0;
  });

  it("keeps the same content element while the options and columns do not change", () => {
    const { rerender } = render(<Harness label="first" />);
    const first = mockContents.at(-1);
    expect(first).toBeDefined();

    rerender(<Harness label="second" />);
    rerender(<Harness label="third" />);

    expect(mockContents.at(-1)).toBe(first);
  });
});
