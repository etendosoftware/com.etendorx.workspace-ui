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
import { SELECTOR_MIN_SEARCH_CHARS } from "../constants";

jest.mock("@/contexts/tab");
jest.mock("react-hook-form");
jest.mock("@/hooks/useFormParent", () => ({ __esModule: true, default: jest.fn(() => ({})) }));
jest.mock("@/hooks/useUserContext", () => ({ useUserContext: jest.fn(() => ({ currentWarehouse: null })) }));
jest.mock("@workspaceui/api-client/src/api/datasource", () => ({
  datasource: { client: { post: jest.fn() } },
}));
jest.mock("@/utils/logger");

const buildField = (datasourceName?: string): Field =>
  ({
    id: "FIELD-1",
    hqlName: "businessPartner",
    columnName: "c_bpartner_id",
    name: "Business Partner",
    selector: datasourceName ? { datasourceName } : undefined,
  }) as unknown as Field;

const postedCalls = () => (datasource.client.post as jest.Mock).mock.calls;

const renderSelector = (field: Field, staticOptions?: Array<{ id: string; name: string }>) =>
  renderHook(() => useTableDirDatasource({ field, staticOptions }));

describe("useTableDirDatasource — minimum search characters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTabContext as jest.Mock).mockReturnValue({ tab: null, parentTab: null, parentRecord: null });
    (useFormContext as jest.Mock).mockReturnValue({ watch: jest.fn(), getValues: jest.fn(() => ({})) });
    (datasource.client.post as jest.Mock).mockResolvedValue({ data: { response: { data: [] } } });
  });

  it("requires the default minimum on a search selector", () => {
    const { result } = renderSelector(buildField("BusinessPartnerSelector"));

    expect(result.current.minSearchChars).toBe(SELECTOR_MIN_SEARCH_CHARS);
  });

  it("does not query the backend below the minimum", async () => {
    const { result } = renderSelector(buildField("BusinessPartnerSelector"));

    await act(async () => {
      result.current.search("a");
      result.current.search("ab");
    });

    expect(postedCalls()).toHaveLength(0);
  });

  it("queries once the minimum is reached, with the typed term", async () => {
    const { result } = renderSelector(buildField("BusinessPartnerSelector"));

    await act(async () => {
      result.current.search("abc");
    });

    expect(postedCalls()).toHaveLength(1);
    expect(JSON.stringify(postedCalls()[0][1])).toContain("abc");
  });

  it("goes back to the default list when the term is cleared", async () => {
    const { result } = renderSelector(buildField("BusinessPartnerSelector"));

    await act(async () => {
      result.current.search("");
    });

    expect(postedCalls()).toHaveLength(1);
  });

  it("does not reuse a too-short term in later fetches", async () => {
    const { result } = renderSelector(buildField("BusinessPartnerSelector"));

    await act(async () => {
      result.current.search("ab");
    });

    expect(result.current.searchTerm).toBe("");
  });

  it("does not require a minimum on a TableDir combo", async () => {
    const { result } = renderSelector(buildField("ComboTableDatasourceService"));

    await act(async () => {
      result.current.search("a");
    });

    expect(result.current.minSearchChars).toBe(0);
    expect(postedCalls()).toHaveLength(1);
  });

  it("does not require a minimum on static options", () => {
    const { result } = renderSelector(buildField("BusinessPartnerSelector"), [{ id: "1", name: "One" }]);

    expect(result.current.minSearchChars).toBe(0);
  });
});
