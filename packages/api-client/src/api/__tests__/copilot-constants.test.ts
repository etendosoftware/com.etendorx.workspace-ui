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

import { isDevelopment, isProduction, COPILOT_ENDPOINTS } from "../copilot/constants";

describe("Copilot Constants", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe("environment detection", () => {
    it("should detect development environment", () => {
      // @ts-ignore
      process.env.NODE_ENV = "development";
      expect(isDevelopment()).toBe(true);
      expect(isProduction()).toBe(false);
    });

    it("should detect production environment", () => {
      // @ts-ignore
      process.env.NODE_ENV = "production";
      expect(isProduction()).toBe(true);
      expect(isDevelopment()).toBe(false);
    });
  });

  describe("COPILOT_ENDPOINTS", () => {
    it("should have expected endpoints", () => {
      expect(COPILOT_ENDPOINTS.UPLOAD_FILE).toBe("copilot/file");
      expect(COPILOT_ENDPOINTS.SEND_QUESTION).toBe("copilot/question");
    });
  });
});
