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

import { classifyNetworkError } from "../networkError";

describe("classifyNetworkError", () => {
  it.each([
    ["Failed to fetch", "network"],
    ["NetworkError when attempting to fetch resource.", "network"],
    ["Load failed", "network"],
  ])("classifies a TypeError '%s' as a network failure", (message, expected) => {
    expect(classifyNetworkError(new TypeError(message))).toBe(expected);
  });

  it("classifies a TimeoutError as a timeout", () => {
    expect(classifyNetworkError(new DOMException("signal timed out", "TimeoutError"))).toBe("timeout");
  });

  it("does not classify an intentional AbortError", () => {
    expect(classifyNetworkError(new DOMException("aborted", "AbortError"))).toBeNull();
  });

  it("does not classify unrelated errors", () => {
    expect(classifyNetworkError(new TypeError("x is not a function"))).toBeNull();
    expect(classifyNetworkError(new Error("Failed to fetch"))).toBeNull();
    expect(classifyNetworkError("Failed to fetch")).toBeNull();
    expect(classifyNetworkError(null)).toBeNull();
  });
});
