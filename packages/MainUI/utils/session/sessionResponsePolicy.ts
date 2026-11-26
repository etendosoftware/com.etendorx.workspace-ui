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

import { HTTP_CODES } from "@workspaceui/api-client/src/api/constants";
import type { Interceptor, InterceptorContext } from "@workspaceui/api-client/src/api/client";
import { isPasswordExpiredResponse } from "./erpErrorCode";

/**
 * What a failed response means for the session, as in Classic: only an explicit authentication
 * failure closes it, any other server error is shown and the user keeps working.
 */
export const SESSION_RESPONSE_ACTION = {
  NONE: "none",
  /** The password expired while the session was open: close it with that reason. */
  PASSWORD_EXPIRED: "passwordExpired",
  /** The token is invalid, expired or revoked (401): close the session. */
  UNAUTHENTICATED: "unauthenticated",
  /** The server failed (5xx): show it and keep the session. */
  SERVER_ERROR: "serverError",
} as const;

export type SessionResponseAction = (typeof SESSION_RESPONSE_ACTION)[keyof typeof SESSION_RESPONSE_ACTION];

export type SessionResponseHandler = (action: SessionResponseAction) => void;

type InspectedResponse = Pick<Response, "status" | "headers">;

let registeredHandler: SessionResponseHandler | null = null;

/**
 * Tells what a response means for the session.
 *
 * @param response the response to inspect; its body is never read
 * @returns the action the session has to take
 */
export function classifySessionResponse(response: InspectedResponse): SessionResponseAction {
  if (isPasswordExpiredResponse(response)) {
    return SESSION_RESPONSE_ACTION.PASSWORD_EXPIRED;
  }
  if (response.status === HTTP_CODES.UNAUTHORIZED) {
    return SESSION_RESPONSE_ACTION.UNAUTHENTICATED;
  }
  if (response.status >= HTTP_CODES.INTERNAL_SERVER_ERROR) {
    return SESSION_RESPONSE_ACTION.SERVER_ERROR;
  }
  return SESSION_RESPONSE_ACTION.NONE;
}

/**
 * Registers the handler that applies the session actions (the user provider). Only one is kept.
 *
 * @param handler the handler to register
 * @returns a function that unregisters it, unless another one replaced it meanwhile
 */
export function registerSessionResponseHandler(handler: SessionResponseHandler): () => void {
  registeredHandler = handler;
  return () => {
    if (registeredHandler === handler) {
      registeredHandler = null;
    }
  };
}

/**
 * Applies the session rule to a response. A server error is not reported when the calling screen
 * shows its own message for it, so the user never sees the same error twice.
 *
 * @param response the response to inspect; its body is never read
 * @param context what is known about the request the response belongs to
 */
export function applySessionResponsePolicy(response: InspectedResponse, context?: Partial<InterceptorContext>): void {
  const action = classifySessionResponse(response);
  if (action === SESSION_RESPONSE_ACTION.NONE || !registeredHandler) {
    return;
  }
  if (action === SESSION_RESPONSE_ACTION.SERVER_ERROR && context?.handlesOwnError) {
    return;
  }
  registeredHandler(action);
}

/** API client interceptor that applies the session rule and hands the response back untouched. */
export const sessionPolicyInterceptor: Interceptor = (response, context) => {
  applySessionResponsePolicy(response, context);
  return response;
};
