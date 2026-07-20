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

import { render, screen, fireEvent } from "@testing-library/react";
import { Label } from "../Label";
import type { Field } from "@workspaceui/api-client/src/api/types";

const mockWatch = jest.fn();
const mockHandleClickRedirect = jest.fn();
const mockHandleKeyDownRedirect = jest.fn();

jest.mock("react-hook-form", () => ({
  useFormContext: () => ({ watch: mockWatch }),
}));

jest.mock("@/contexts/tab", () => ({
  useTabContext: () => ({ tab: { window: "W-CURRENT" } }),
}));

jest.mock("@/hooks/navigation/useRedirect", () => ({
  useRedirect: () => ({
    handleClickRedirect: mockHandleClickRedirect,
    handleKeyDownRedirect: mockHandleKeyDownRedirect,
  }),
}));

jest.mock("@workspaceui/api-client/src/utils/metadata", () => ({
  isEntityReference: () => true,
}));

jest.mock("@/utils", () => ({
  getFieldReference: () => "TABLEDIR",
}));

const REDIRECT_LINK_ROLE_NAME = "Navigate to referenced window";

const buildField = (overrides: Partial<Field> = {}): Field =>
  ({
    hqlName: "businessPartner",
    name: "Business Partner",
    fieldGroup: "main",
    isReferencedWindowAccessible: true,
    referencedWindowId: "W-BP",
    referencedTabId: "TAB-BP",
    referencedEntity: "BusinessPartner",
    id: "field-1",
    column: { reference: "19", referenceSearchKey$_identifier: "", dBColumnName: "C_BPartner_ID" },
    ...overrides,
  }) as unknown as Field;

describe("Label", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a plain (non-interactive) label when the field is not a reference", () => {
    mockWatch.mockReturnValue("some-record-id");
    render(<Label field={buildField({ isReferencedWindowAccessible: false })} />);

    expect(screen.getByText("Business Partner")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: REDIRECT_LINK_ROLE_NAME })).not.toBeInTheDocument();
  });

  it("renders as a clickable redirect link when the field has a value", () => {
    mockWatch.mockReturnValue("record-123");
    render(<Label field={buildField()} />);

    expect(screen.getByRole("button", { name: REDIRECT_LINK_ROLE_NAME })).toBeInTheDocument();
  });

  it("still renders as a clickable redirect link when the field is empty", () => {
    mockWatch.mockReturnValue(undefined);
    render(<Label field={buildField()} />);

    expect(screen.getByRole("button", { name: REDIRECT_LINK_ROLE_NAME })).toBeInTheDocument();
  });

  it("passes selectedRecordId to handleClickRedirect when the field has a value", () => {
    mockWatch.mockReturnValue("record-123");
    render(<Label field={buildField()} />);

    fireEvent.click(screen.getByRole("button", { name: REDIRECT_LINK_ROLE_NAME }));

    expect(mockHandleClickRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        windowId: "W-BP",
        referencedTabId: "TAB-BP",
        selectedRecordId: "record-123",
        referencedLinkContext: expect.objectContaining({
          entityName: "BusinessPartner",
          fieldId: "field-1",
          currentWindowId: "W-CURRENT",
          columnName: "C_BPartner_ID",
        }),
      })
    );
  });

  it("passes an undefined selectedRecordId and no referencedLinkContext when the field is empty", () => {
    mockWatch.mockReturnValue(undefined);
    render(<Label field={buildField()} />);

    fireEvent.click(screen.getByRole("button", { name: REDIRECT_LINK_ROLE_NAME }));

    expect(mockHandleClickRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        windowId: "W-BP",
        referencedTabId: "TAB-BP",
        selectedRecordId: undefined,
        referencedLinkContext: undefined,
      })
    );
  });

  it("triggers handleKeyDownRedirect on keydown even when the field is empty", () => {
    mockWatch.mockReturnValue(undefined);
    render(<Label field={buildField()} />);

    fireEvent.keyDown(screen.getByRole("button", { name: REDIRECT_LINK_ROLE_NAME }), { key: "Enter" });

    expect(mockHandleKeyDownRedirect).toHaveBeenCalledWith(expect.objectContaining({ selectedRecordId: undefined }));
  });
});
