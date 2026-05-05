/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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
  PROCESS_RESPONSE_FIELDS,
  readProcessResponseFlag,
  shouldRefreshAfterProcess,
  shouldRetryAfterProcess,
} from "../processResponseFlags";

describe("processResponseFlags", () => {
  describe("readProcessResponseFlag", () => {
    it("returns the boolean when the flag is at the top level", () => {
      expect(readProcessResponseFlag({ flag: true }, "flag")).toBe(true);
      expect(readProcessResponseFlag({ flag: false }, "flag")).toBe(false);
    });

    it("returns the boolean when the flag is under response", () => {
      expect(readProcessResponseFlag({ response: { flag: true } }, "flag")).toBe(true);
      expect(readProcessResponseFlag({ response: { flag: false } }, "flag")).toBe(false);
    });

    it("returns the boolean when the flag is under response.data", () => {
      expect(readProcessResponseFlag({ response: { data: { flag: true } } }, "flag")).toBe(true);
      expect(readProcessResponseFlag({ response: { data: { flag: false } } }, "flag")).toBe(false);
    });

    it("uses top-down precedence when the flag appears in multiple paths", () => {
      const data = { flag: false, response: { flag: true } };
      expect(readProcessResponseFlag(data, "flag")).toBe(false);
    });

    it("returns undefined when the flag is absent", () => {
      expect(readProcessResponseFlag({}, "flag")).toBeUndefined();
      expect(readProcessResponseFlag({ response: {} }, "flag")).toBeUndefined();
      expect(readProcessResponseFlag({ response: { data: {} } }, "flag")).toBeUndefined();
    });

    it("returns undefined when the value is non-boolean", () => {
      expect(readProcessResponseFlag({ flag: "true" }, "flag")).toBeUndefined();
      expect(readProcessResponseFlag({ flag: 1 }, "flag")).toBeUndefined();
      expect(readProcessResponseFlag({ flag: 0 }, "flag")).toBeUndefined();
      expect(readProcessResponseFlag({ flag: null }, "flag")).toBeUndefined();
    });

    it("returns undefined for non-object inputs", () => {
      expect(readProcessResponseFlag(null, "flag")).toBeUndefined();
      expect(readProcessResponseFlag(undefined, "flag")).toBeUndefined();
      expect(readProcessResponseFlag("string", "flag")).toBeUndefined();
      expect(readProcessResponseFlag(42, "flag")).toBeUndefined();
    });
  });

  describe("shouldRefreshAfterProcess", () => {
    it("defaults to true when refreshParent is absent", () => {
      expect(shouldRefreshAfterProcess({})).toBe(true);
    });

    it("returns false when refreshParent is explicitly false", () => {
      expect(shouldRefreshAfterProcess({ [PROCESS_RESPONSE_FIELDS.REFRESH_PARENT]: false })).toBe(false);
    });

    it("returns true when refreshParent is explicitly true", () => {
      expect(shouldRefreshAfterProcess({ [PROCESS_RESPONSE_FIELDS.REFRESH_PARENT]: true })).toBe(true);
    });

    it("reads refreshParent under response.data", () => {
      expect(
        shouldRefreshAfterProcess({
          response: { data: { [PROCESS_RESPONSE_FIELDS.REFRESH_PARENT]: false } },
        })
      ).toBe(false);
    });
  });

  describe("shouldRetryAfterProcess", () => {
    it("defaults to false when retryExecution is absent", () => {
      expect(shouldRetryAfterProcess({})).toBe(false);
    });

    it("returns true when retryExecution is explicitly true", () => {
      expect(shouldRetryAfterProcess({ [PROCESS_RESPONSE_FIELDS.RETRY_EXECUTION]: true })).toBe(true);
    });

    it("returns false when retryExecution is explicitly false", () => {
      expect(shouldRetryAfterProcess({ [PROCESS_RESPONSE_FIELDS.RETRY_EXECUTION]: false })).toBe(false);
    });

    it("reads retryExecution under response.data", () => {
      expect(
        shouldRetryAfterProcess({
          response: { data: { [PROCESS_RESPONSE_FIELDS.RETRY_EXECUTION]: true } },
        })
      ).toBe(true);
    });
  });
});
