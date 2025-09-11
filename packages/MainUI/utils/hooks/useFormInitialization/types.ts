import type { FormInitializationResponse } from "@workspaceui/api-client/src/api/types";

export interface RecordData {
  creationDate?: string | null;
  createdBy$_identifier?: string | null;
  updated?: string | null;
  updatedBy$_identifier?: string | null;
  [key: string]: unknown;
}

export type State =
  | {
      loading: true;
      error: null;
      formInitialization: null;
    }
  | {
      loading: false;
      error: null;
      formInitialization: FormInitializationResponse;
    }
  | {
      loading: false;
      error: Error;
      formInitialization: FormInitializationResponse | null;
    };

export type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: FormInitializationResponse }
  | { type: "FETCH_ERROR"; payload: Error };
