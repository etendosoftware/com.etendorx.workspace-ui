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

import { fireEvent, render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { LinkSelector } from "../LinkSelector";
import type { Field } from "@workspaceui/api-client/src/api/types";
import en from "@workspaceui/componentlibrary/src/locales/en";

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

const PROTOCOL_LESS_URL = "www.etendo.software";
const INVALID_URL = "not a url";
const OPEN_BUTTON_TEST_ID = `LinkSelector__open__${mockField.id}`;
const INVALID_URL_MESSAGE = en.form.link.invalidUrl;

/** Renders the editable selector and leaves the input, as the user does before Classic validates. */
const renderAndBlur = (defaultValue: string) => {
  render(<Wrapper defaultValue={defaultValue} />);
  fireEvent.blur(screen.getByRole("textbox"));
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

  describe("opening the link", () => {
    let openSpy: jest.SpyInstance;

    beforeEach(() => {
      openSpy = jest.spyOn(window, "open").mockReturnValue(null);
    });

    afterEach(() => {
      openSpy.mockRestore();
    });

    it.each([
      [PROTOCOL_LESS_URL, `http://${PROTOCOL_LESS_URL}`],
      ["https://example.com", "https://example.com"],
    ])("opens %p as the external address %p", (value, expected) => {
      render(<Wrapper defaultValue={value} />);
      fireEvent.click(screen.getByTestId(OPEN_BUTTON_TEST_ID));
      expect(openSpy).toHaveBeenCalledWith(expected, "_blank", "noopener,noreferrer");
    });

    it("hides the open button when the value has a non-web protocol", () => {
      render(<Wrapper defaultValue="javascript://alert" />);
      expect(screen.queryByTestId(OPEN_BUTTON_TEST_ID)).not.toBeInTheDocument();
    });

    it("links a protocol-less value to the external address in read-only mode", () => {
      render(<Wrapper defaultValue={PROTOCOL_LESS_URL} readOnly />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", `http://${PROTOCOL_LESS_URL}`);
      expect(link).toHaveTextContent(PROTOCOL_LESS_URL);
    });
  });

  describe("URL validation", () => {
    it("does not flag an invalid URL before the user leaves the field", () => {
      render(<Wrapper defaultValue={INVALID_URL} />);
      expect(screen.queryByText(INVALID_URL_MESSAGE)).not.toBeInTheDocument();
    });

    it("flags an invalid URL once the user leaves the field", () => {
      renderAndBlur(INVALID_URL);
      expect(screen.getByText(INVALID_URL_MESSAGE)).toBeInTheDocument();
    });

    it.each([[PROTOCOL_LESS_URL], ["https://example.com"], [""]])("accepts %p after leaving the field", (value) => {
      renderAndBlur(value);
      expect(screen.queryByText(INVALID_URL_MESSAGE)).not.toBeInTheDocument();
    });
  });
});
