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
 * All portions are Copyright (C) 2021-2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { LinkSelector } from "../LinkSelector";
import type { Field } from "@workspaceui/api-client/src/api/types";

jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({ language: "en_US" }),
}));

const mockField: Field = {
  id: "link-1",
  name: "URL",
  hqlName: "url",
  columnName: "url",
  isMandatory: false,
  column: { reference: "800101" },
} as unknown as Field;

const Wrapper = ({ defaultValue = "", readOnly = false }: { defaultValue?: string; readOnly?: boolean }) => {
  const methods = useForm({ defaultValues: { url: defaultValue } });
  return (
    <FormProvider {...methods}>
      <LinkSelector field={mockField} isReadOnly={readOnly} />
    </FormProvider>
  );
};

describe("LinkSelector", () => {
  it("should render as text input in edit mode", () => {
    render(<Wrapper defaultValue="https://example.com" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("https://example.com");
  });

  it("should render as clickable link in read-only mode", () => {
    render(<Wrapper defaultValue="https://example.com" readOnly />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("should render empty in read-only mode when no value", () => {
    render(<Wrapper defaultValue="" readOnly />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
