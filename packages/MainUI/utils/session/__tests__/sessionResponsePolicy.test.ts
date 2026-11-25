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
  SESSION_RESPONSE_ACTION,
  applySessionResponsePolicy,
  classifySessionResponse,
  registerSessionResponseHandler,
  sessionPolicyInterceptor,
} from "../sessionResponsePolicy";
import { sessionResponse } from "@/utils/tests/sessionResponseMocks";

describe("utils/session/sessionResponsePolicy", () => {
  let handler: jest.Mock;
  let unregister: () => void;

  beforeEach(() => {
    handler = jest.fn();
    unregister = registerSessionResponseHandler(handler);
  });

  afterEach(() => {
    unregister();
  });

  describe("classifySessionResponse", () => {
    it.each([
      [200, SESSION_RESPONSE_ACTION.NONE],
      [403, SESSION_RESPONSE_ACTION.NONE],
      [404, SESSION_RESPONSE_ACTION.NONE],
      [401, SESSION_RESPONSE_ACTION.UNAUTHENTICATED],
      [500, SESSION_RESPONSE_ACTION.SERVER_ERROR],
      [503, SESSION_RESPONSE_ACTION.SERVER_ERROR],
    ])("classifies a %i as %s", (status, action) => {
      expect(classifySessionResponse(sessionResponse(status))).toBe(action);
    });

    it("gives the expired-password rejection precedence over its 401", () => {
      expect(classifySessionResponse(sessionResponse(401, true))).toBe(SESSION_RESPONSE_ACTION.PASSWORD_EXPIRED);
    });
  });

  describe("applySessionResponsePolicy", () => {
    it("reports an authentication failure even when the screen handles its own error", () => {
      applySessionResponsePolicy(sessionResponse(401), { handlesOwnError: true });

      expect(handler).toHaveBeenCalledWith(SESSION_RESPONSE_ACTION.UNAUTHENTICATED);
    });

    it("reports a server error when the screen does not show its own", () => {
      applySessionResponsePolicy(sessionResponse(500));

      expect(handler).toHaveBeenCalledWith(SESSION_RESPONSE_ACTION.SERVER_ERROR);
    });

    it("does not report a server error the screen already shows", () => {
      applySessionResponsePolicy(sessionResponse(500), { handlesOwnError: true });

      expect(handler).not.toHaveBeenCalled();
    });

    it("ignores responses that mean nothing for the session", () => {
      applySessionResponsePolicy(sessionResponse(200));

      expect(handler).not.toHaveBeenCalled();
    });

    it("does nothing once the handler is unregistered", () => {
      unregister();

      applySessionResponsePolicy(sessionResponse(401));

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("registerSessionResponseHandler", () => {
    it("keeps a newer handler when an older one unregisters", () => {
      const newer = jest.fn();
      const unregisterNewer = registerSessionResponseHandler(newer);

      unregister();
      applySessionResponsePolicy(sessionResponse(401));

      expect(newer).toHaveBeenCalledWith(SESSION_RESPONSE_ACTION.UNAUTHENTICATED);
      expect(handler).not.toHaveBeenCalled();
      unregisterNewer();
    });
  });

  describe("sessionPolicyInterceptor", () => {
    it("applies the rule with the request context and hands the response back", () => {
      const response = sessionResponse(500);

      expect(sessionPolicyInterceptor(response, { handlesOwnError: true })).toBe(response);
      expect(handler).not.toHaveBeenCalled();

      expect(sessionPolicyInterceptor(response)).toBe(response);
      expect(handler).toHaveBeenCalledWith(SESSION_RESPONSE_ACTION.SERVER_ERROR);
    });
  });
});
