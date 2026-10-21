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

import React from "react";
import { act, render } from "@testing-library/react";
import ProfileWrapper from "../Profile";

type CapturedProps = {
  saveAsDefault: boolean;
  onSaveAsDefaultChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onProfileApplied: () => void;
};

let modalProps: CapturedProps;

jest.mock("../../ProfileModal/ProfileModal", () => ({
  __esModule: true,
  default: (props: CapturedProps) => {
    modalProps = props;
    return null;
  },
}));

jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({ language: "en_US", setLanguage: jest.fn(), getFlag: () => "" }),
}));

const userContext = {
  currentRole: { id: "role-1", name: "Role 1" },
  currentOrganization: null,
  currentClient: null,
  currentWarehouse: null,
  profile: { name: "John", email: "john@example.com", image: "" },
  roles: [],
  languages: [],
  changeProfile: jest.fn(),
  changePassword: jest.fn(),
  setDefaultConfiguration: jest.fn(),
};

describe("ProfileWrapper", () => {
  it("unticks 'Save as default' once the profile modal applied a change", () => {
    jest.spyOn(React, "useContext").mockReturnValue(userContext);
    // biome-ignore lint/suspicious/noExplicitAny: ProfileModal is mocked, the wrapper props are not rendered
    render(<ProfileWrapper {...({} as any)} />);

    act(() => modalProps.onSaveAsDefaultChange({ target: { checked: true } } as React.ChangeEvent<HTMLInputElement>));
    expect(modalProps.saveAsDefault).toBe(true);

    act(() => modalProps.onProfileApplied());
    expect(modalProps.saveAsDefault).toBe(false);
  });
});
