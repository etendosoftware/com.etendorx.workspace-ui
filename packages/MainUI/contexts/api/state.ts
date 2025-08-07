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

export interface State {
  connected: boolean;
  error: boolean;
  loading: boolean;
}

export type Action = { type: "SET_CONNECTED" } | { type: "SET_ERROR" } | { type: "RESET" };

export const initialState: State = {
  connected: false,
  error: false,
  loading: false,
};

export function stateReducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_CONNECTED":
      return { ...state, connected: true, error: false, loading: false };
    case "SET_ERROR":
      return { ...state, error: true, connected: false, loading: false };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}
