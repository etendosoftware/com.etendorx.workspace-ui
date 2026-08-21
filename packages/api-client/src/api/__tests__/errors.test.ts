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

import {
  WINDOW_ACCESS_DENIED_ERROR_MESSAGE,
  WINDOW_ACCESS_DENIED_ERROR_NAME,
  WINDOW_NOT_FOUND_ERROR_MESSAGE,
  WindowAccessDeniedError,
  isWindowAccessDeniedError,
} from "../errors";

const WINDOW_ID = "102";

describe("WindowAccessDeniedError", () => {
  it("exposes the window id and status it was built with", () => {
    const error = new WindowAccessDeniedError(WINDOW_ID, 401);

    expect(error.windowId).toBe(WINDOW_ID);
    expect(error.status).toBe(401);
  });

  it("is named so it can be detected without instanceof", () => {
    const error = new WindowAccessDeniedError(WINDOW_ID, 401);

    expect(error.name).toBe(WINDOW_ACCESS_DENIED_ERROR_NAME);
    expect(error.message).toBe(WINDOW_ACCESS_DENIED_ERROR_MESSAGE);
  });

  it("keeps the Error prototype chain despite the ES5 target", () => {
    const error = new WindowAccessDeniedError(WINDOW_ID, 401);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(WindowAccessDeniedError);
  });

  it("does not contain the legacy 'not found' substring", () => {
    // Consumers close missing windows by matching the legacy message; an access-denied error must
    // never fall into that branch.
    expect(WINDOW_ACCESS_DENIED_ERROR_MESSAGE.toLowerCase()).not.toContain("not found");
    expect(WINDOW_NOT_FOUND_ERROR_MESSAGE.toLowerCase()).toContain("not found");
  });
});

describe("isWindowAccessDeniedError", () => {
  it("recognizes the typed error", () => {
    expect(isWindowAccessDeniedError(new WindowAccessDeniedError(WINDOW_ID, 401))).toBe(true);
  });

  it("recognizes a plain object carrying the same name, to survive module duplication", () => {
    expect(isWindowAccessDeniedError({ name: WINDOW_ACCESS_DENIED_ERROR_NAME })).toBe(true);
  });

  it.each([
    ["a generic Error", new Error(WINDOW_NOT_FOUND_ERROR_MESSAGE)],
    ["null", null],
    ["undefined", undefined],
    ["a string", WINDOW_ACCESS_DENIED_ERROR_NAME],
    ["an unrelated object", { status: 401 }],
  ])("rejects %s", (_label, value) => {
    expect(isWindowAccessDeniedError(value)).toBe(false);
  });
});
