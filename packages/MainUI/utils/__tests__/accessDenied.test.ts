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

import { toast } from "sonner";
import { WindowAccessDeniedError } from "@workspaceui/api-client/src/api/errors";
import { DEFAULT_ACCESS_TABLE_NO_VIEW_ERROR } from "@/utils/session/constants";
import type { TranslateFunction } from "@/hooks/types";
import {
  type AccessDeniedToastTexts,
  buildAccessDeniedToastDescription,
  buildAccessDeniedToastTexts,
  isAccessDeniedError,
  reportWindowsAccessDenied,
} from "../accessDenied";

jest.mock("sonner", () => ({ toast: { warning: jest.fn() } }));

const TEXTS: AccessDeniedToastTexts = {
  title: "Some windows were not opened",
  descriptionOne: "One window was discarded.",
  descriptionMany: "windows were discarded.",
};

const datasourceError = (message: string) => ({ response: { error: { message } } });

describe("isAccessDeniedError", () => {
  it.each([
    ["the typed window error", new WindowAccessDeniedError("102", 401)],
    ["a direct datasource response", datasourceError(DEFAULT_ACCESS_TABLE_NO_VIEW_ERROR)],
    ["a wrapped datasource response", { body: datasourceError(DEFAULT_ACCESS_TABLE_NO_VIEW_ERROR) }],
    ["a 401 datasource wrapper", { __error: true, status: 401 }],
    ["an Error carrying the ERP message", new Error(DEFAULT_ACCESS_TABLE_NO_VIEW_ERROR)],
  ])("detects %s", (_label, error) => {
    expect(isAccessDeniedError(error)).toBe(true);
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["an unrelated datasource message", datasourceError("Something else")],
    ["a status without the error marker", { status: 401 }],
    ["a generic Error", new Error("boom")],
    ["a string", DEFAULT_ACCESS_TABLE_NO_VIEW_ERROR],
  ])("ignores %s", (_label, error) => {
    expect(isAccessDeniedError(error)).toBe(false);
  });
});

describe("buildAccessDeniedToastTexts", () => {
  it("reads the three discarded-windows keys", () => {
    const t = ((key: string) => key) as TranslateFunction;

    expect(buildAccessDeniedToastTexts(t)).toEqual({
      title: "errors.accessDenied.discarded.title",
      descriptionOne: "errors.accessDenied.discarded.descriptionOne",
      descriptionMany: "errors.accessDenied.discarded.descriptionMany",
    });
  });
});

describe("buildAccessDeniedToastDescription", () => {
  it("uses the dedicated sentence for a single window", () => {
    expect(buildAccessDeniedToastDescription(1, TEXTS)).toBe(TEXTS.descriptionOne);
  });

  it("prefixes the count for several windows", () => {
    expect(buildAccessDeniedToastDescription(3, TEXTS)).toBe(`3 ${TEXTS.descriptionMany}`);
  });
});

describe("reportWindowsAccessDenied", () => {
  let showAccessDeniedScreen: jest.Mock;

  const report = (deniedCount: number, remainingWindowCount: number) =>
    reportWindowsAccessDenied({ deniedCount, remainingWindowCount, texts: TEXTS, showAccessDeniedScreen });

  beforeEach(() => {
    jest.clearAllMocks();
    showAccessDeniedScreen = jest.fn();
  });

  it("does nothing when no window was discarded", () => {
    report(0, 2);

    expect(toast.warning).not.toHaveBeenCalled();
    expect(showAccessDeniedScreen).not.toHaveBeenCalled();
  });

  it("shows a toast when other windows survived", () => {
    report(2, 1);

    expect(toast.warning).toHaveBeenCalledWith(TEXTS.title, {
      description: `2 ${TEXTS.descriptionMany}`,
    });
    expect(showAccessDeniedScreen).not.toHaveBeenCalled();
  });

  it("switches to the full-screen view when no window survived", () => {
    report(1, 0);

    expect(showAccessDeniedScreen).toHaveBeenCalledWith(1);
    expect(toast.warning).not.toHaveBeenCalled();
  });
});
