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

import { act, renderHook } from "@testing-library/react";
import { useFormContext } from "react-hook-form";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import type { Field } from "@workspaceui/api-client/src/api/types";
import { useTabContext } from "@/contexts/tab";
import { useTableDirDatasource } from "../useTableDirDatasource";

jest.mock("@/contexts/tab");
jest.mock("react-hook-form");
jest.mock("@/hooks/useFormParent", () => ({ __esModule: true, default: jest.fn(() => ({})) }));
jest.mock("@/hooks/useUserContext", () => ({ useUserContext: jest.fn(() => ({ currentWarehouse: null })) }));
jest.mock("@workspaceui/api-client/src/api/datasource", () => ({
  datasource: { client: { post: jest.fn() } },
}));
jest.mock("@/utils/logger");

const field = {
  id: "FIELD-1",
  hqlName: "businessPartner",
  columnName: "c_bpartner_id",
  name: "Business Partner",
  selector: { datasourceName: "BusinessPartnerSelector" },
} as unknown as Field;

const requestParams = (): Record<string, unknown> => (datasource.client.post as jest.Mock).mock.calls[0][1].params;

describe("useTableDirDatasource — form values sent as request parameters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTabContext as jest.Mock).mockReturnValue({ tab: null, parentTab: null, parentRecord: null });
    (useFormContext as jest.Mock).mockReturnValue({
      watch: jest.fn(),
      getValues: jest.fn(() => ({
        description: "A text",
        businessPartner$_identifier: "Customer A",
        invoiceTerms: "D",
        invoiceTerms$_entries: [
          { id: "D", label: "After Delivery" },
          { id: "I", label: "Immediate" },
        ],
      })),
    });
    (datasource.client.post as jest.Mock).mockResolvedValue({ data: { response: { data: [] } } });
  });

  const fetchOptions = async () => {
    const { result } = renderHook(() => useTableDirDatasource({ field }));
    await act(async () => {
      result.current.refetch();
    });
  };

  it("does not send the dropdown lists of the form (`$_entries`)", async () => {
    await fetchOptions();

    expect(Object.keys(requestParams()).filter((key) => key.endsWith("$_entries"))).toEqual([]);
    expect(JSON.stringify(requestParams())).not.toContain("[object Object]");
  });

  it("keeps sending the rest of the form values, identifiers included", async () => {
    await fetchOptions();

    expect(requestParams()).toMatchObject({
      description: "A text",
      businessPartner$_identifier: "Customer A",
      invoiceTerms: "D",
    });
  });
});
