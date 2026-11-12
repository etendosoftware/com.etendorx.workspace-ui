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
import type { ReactNode } from "react";
import type { Tab } from "@workspaceui/api-client/src/api/types";
import TabContextProvider, { useTabContext } from "../tab";

jest.mock("@/hooks/useSelected", () => ({
  useSelected: () => ({ graph: { getParent: () => null } }),
}));
jest.mock("@/hooks/useSelectedRecord", () => ({ useSelectedRecord: () => null }));
jest.mock("@/hooks/useSelectedRecords", () => ({ useSelectedRecords: () => [] }));
jest.mock("../ToolbarContext", () => ({ ToolbarProvider: ({ children }: { children: ReactNode }) => children }));
jest.mock(
  "../UnsavedChangesTabGuard",
  () =>
    ({ children }: { children: ReactNode }) =>
      children
);
jest.mock("../searchContext", () => ({ SearchProvider: ({ children }: { children: ReactNode }) => children }));

const LEGAL_ORG = "ETSG_CheckLegalOrg";
// The server sends the raw value of the auxiliary input's query: `SELECT 1` arrives as a number.
const RAW_ONE = 1 as unknown as string;

const wrapper = ({ children }: { children: ReactNode }) => (
  <TabContextProvider tab={{ id: "143" } as Tab}>{children}</TabContextProvider>
);

const renderTabContext = () => renderHook(() => useTabContext(), { wrapper });

describe("TabContext auxiliary inputs", () => {
  it("exposes the auxiliary inputs as set when the record has no session attributes", () => {
    const { result } = renderTabContext();

    act(() => result.current.setAuxiliaryInputs({ [LEGAL_ORG]: RAW_ONE }));

    expect(result.current.auxiliaryInputs).toEqual({ [LEGAL_ORG]: 1 });
  });

  it("reads an auxiliary input as the record's session attribute of the same name", () => {
    const { result } = renderTabContext();

    act(() => {
      result.current.setAuxiliaryInputs({ [LEGAL_ORG]: RAW_ONE, HasLines: RAW_ONE });
      result.current.setRecordSessionAttributes({ [LEGAL_ORG]: "1", AD_ROLE_ID: "0" });
    });

    expect(result.current.auxiliaryInputs).toEqual({ [LEGAL_ORG]: "1", HasLines: 1 });
  });

  it("keeps the session attribute when a callout recomputes the auxiliary input", () => {
    const { result } = renderTabContext();
    act(() => {
      result.current.setAuxiliaryInputs({ [LEGAL_ORG]: RAW_ONE });
      result.current.setRecordSessionAttributes({ [LEGAL_ORG]: "1" });
    });

    act(() => result.current.setAuxiliaryInputs((previous) => ({ ...previous, [LEGAL_ORG]: RAW_ONE })));

    expect(result.current.auxiliaryInputs).toEqual({ [LEGAL_ORG]: "1" });
  });

  it("clears the overrides with the record's session attributes", () => {
    const { result } = renderTabContext();
    act(() => {
      result.current.setAuxiliaryInputs({ [LEGAL_ORG]: RAW_ONE });
      result.current.setRecordSessionAttributes({ [LEGAL_ORG]: "1" });
    });

    act(() => result.current.setRecordSessionAttributes({}));

    expect(result.current.auxiliaryInputs).toEqual({ [LEGAL_ORG]: 1 });
  });
});
