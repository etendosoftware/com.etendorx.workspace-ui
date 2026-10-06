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
import type { Field } from "@workspaceui/api-client/src/api/types";
import { createSmartContext } from "@/utils/expressions";
import { FormHeader } from "../FormHeader";

jest.mock("@mui/material", () => ({
  useTheme: () => ({ palette: { baselineColor: { neutral: { 0: "#fff", 80: "#333" } } } }),
}));
// Same object on every call, like react-hook-form between edits, so the hook's memo holds across renders.
const mockFormValues = { docStatus: "CO" };
jest.mock("react-hook-form", () => ({ useFormContext: () => ({ watch: () => mockFormValues }) }));
jest.mock("@/stores/userStore", () => ({ useUserStore: (selector: any) => selector({ session: {} }) }));
jest.mock("@/contexts/tab", () => ({ useTabContext: () => ({ tab: { fields: {}, window: "W1" } }) }));
jest.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("../contexts/FormViewContext", () => ({
  useFormViewContext: () => ({ selectedTab: "", handleTabChange: jest.fn(), getIconForGroup: () => null }),
}));
jest.mock("../StatusBar", () => ({ __esModule: true, default: () => null }));
jest.mock("@workspaceui/componentlibrary/src/components/StatusModal", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@workspaceui/componentlibrary/src/assets/icons/info.svg", () => ({ __esModule: true, default: () => null }));
jest.mock("@workspaceui/componentlibrary/src/components/PrimaryTab", () => ({
  __esModule: true,
  default: ({ tabs }: { tabs: Array<{ id: string; label: string }> }) => (
    <ul>
      {tabs.map((tab) => (
        <li key={tab.id}>{tab.label}</li>
      ))}
    </ul>
  ),
}));
jest.mock("../selectors/BaseSelector", () => ({ compileExpression: jest.fn(() => () => true) }));
jest.mock("@/utils/expressions", () => ({ createSmartContext: jest.fn(() => ({})) }));

const fieldWithLogic = (hqlName: string) =>
  ({ hqlName, displayed: true, displayLogicExpression: "@docStatus@ = 'CO'" }) as unknown as Field;

const sectionOf = (name: string, count: number): [string, { identifier: string; fields: Record<string, Field> }] => [
  name,
  {
    identifier: name,
    fields: Object.fromEntries(Array.from({ length: count }, (_, i) => [`${name}${i}`, fieldWithLogic(`${name}${i}`)])),
  },
];

const renderHeader = () =>
  render(
    <FormHeader
      statusBarFields={{}}
      groups={[sectionOf("Main", 3), sectionOf("Dimensions", 3)]}
      statusModal={{ open: false } as any}
      hideStatusModal={jest.fn()}
    />
  );

describe("FormHeader section tabs", () => {
  beforeEach(() => jest.clearAllMocks());
  // clearAllMocks keeps implementations: restore the module mock's default so overrides don't leak.
  afterEach(() => {
    (createSmartContext as jest.Mock).mockReset().mockImplementation(() => ({}));
  });

  it("builds the evaluation context once per render, not once per field", () => {
    renderHeader();
    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(screen.getByText("Dimensions")).toBeInTheDocument();
    // 6 fields with display logic: the old code built 2+ contexts (one per field evaluated).
    expect(createSmartContext).toHaveBeenCalledTimes(1);
  });

  it("still shows the sections when the context build throws", () => {
    (createSmartContext as jest.Mock).mockImplementation(() => {
      throw new Error("boom");
    });
    renderHeader();
    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(screen.getByText("Dimensions")).toBeInTheDocument();
  });
});
