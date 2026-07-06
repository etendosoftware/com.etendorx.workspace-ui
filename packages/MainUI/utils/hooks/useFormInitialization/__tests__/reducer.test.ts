import { reducer } from "@/hooks/useFormInitialization";
import type { State } from "../types";
import type { FormInitializationResponse } from "@workspaceui/api-client/src/api/types";

const initialState: State = {
  loading: true,
  error: null,
  formInitialization: null,
};

const payload = { columnValues: {}, auxiliaryInputValues: {} } as unknown as FormInitializationResponse;

describe("useFormInitialization reducer", () => {
  describe("FETCH_START", () => {
    it("resets to loading state from initial", () => {
      const next = reducer(initialState, { type: "FETCH_START" });
      expect(next).toEqual({ loading: true, error: null, formInitialization: null });
    });

    it("clears a previously loaded form when refetching", () => {
      const loaded: State = { loading: false, error: null, formInitialization: payload };
      const next = reducer(loaded, { type: "FETCH_START" });
      expect(next).toEqual({ loading: true, error: null, formInitialization: null });
    });
  });

  describe("FETCH_SUCCESS", () => {
    it("transitions loading→done and stores the payload", () => {
      const next = reducer(initialState, { type: "FETCH_SUCCESS", payload });
      expect(next).toEqual({ loading: false, error: null, formInitialization: payload });
    });
  });

  describe("FETCH_ERROR", () => {
    it("sets the error and clears loading without erasing prior data", () => {
      const loaded: State = { loading: false, error: null, formInitialization: payload };
      const err = new Error("boom");
      const next = reducer(loaded, { type: "FETCH_ERROR", payload: err });
      expect(next).toEqual({ loading: false, error: err, formInitialization: payload });
    });

    it("when no prior data was loaded, formInitialization stays null", () => {
      const err = new Error("boom");
      const next = reducer(initialState, { type: "FETCH_ERROR", payload: err });
      expect(next).toEqual({ loading: false, error: err, formInitialization: null });
    });
  });

  describe("CLEAR", () => {
    it("from initial state: leaves loading=false instead of hanging at true (FIC guard contract)", () => {
      const next = reducer(initialState, { type: "CLEAR" });
      expect(next).toEqual({ loading: false, error: null, formInitialization: null });
    });

    it("after FETCH_SUCCESS: drops the loaded form so a stale view doesn't leak", () => {
      const loaded: State = { loading: false, error: null, formInitialization: payload };
      const next = reducer(loaded, { type: "CLEAR" });
      expect(next).toEqual({ loading: false, error: null, formInitialization: null });
    });

    it("after FETCH_ERROR: discards the error so the form is not stuck in a failed state", () => {
      const failed: State = { loading: false, error: new Error("x"), formInitialization: null };
      const next = reducer(failed, { type: "CLEAR" });
      expect(next).toEqual({ loading: false, error: null, formInitialization: null });
    });
  });

  describe("unknown action", () => {
    it("returns the same state reference for unknown action types", () => {
      const next = reducer(initialState, { type: "UNKNOWN" } as unknown as Parameters<typeof reducer>[1]);
      expect(next).toBe(initialState);
    });
  });
});
