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

import { renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { ENTRY_UNAVAILABLE_MESSAGE } from "@/utils/menu/menuAvailability";
import { useEntryUnavailableNotice } from "../useEntryUnavailableNotice";

jest.mock("sonner", () => ({ toast: { warning: jest.fn() } }));
jest.mock("@/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const mockGetLabel = jest.fn();
jest.mock("@/contexts/language", () => ({ useLanguage: () => ({ getLabel: mockGetLabel }) }));

describe("useEntryUnavailableNotice (ETP-6431)", () => {
  const notify = () => renderHook(() => useEntryUnavailableNotice()).result.current();

  beforeEach(() => jest.clearAllMocks());

  it("shows the catalog message of Classic", () => {
    mockGetLabel.mockImplementation((code: string) => (code === ENTRY_UNAVAILABLE_MESSAGE ? "No access" : code));

    notify();

    expect(toast.warning).toHaveBeenCalledWith("No access");
  });

  it("falls back to the local text when the catalog does not have it", () => {
    mockGetLabel.mockImplementation((code: string) => code);

    notify();

    expect(toast.warning).toHaveBeenCalledWith("dashboard.entryUnavailable");
  });
});
