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

import { act, renderHook } from "@testing-library/react";
import { CALLOUT_HIGHLIGHT_DURATION_MS } from "@/utils/callouts/calloutHighlight";
import { useCalloutHighlightStore, useCalloutHighlightToken } from "../calloutHighlightStore";

const SCOPE = "form:TAB1";
const OTHER_SCOPE = "grid:TAB1:ROW1";
const PRICE = "priceActual";
const TAX = "tax";

const getHighlights = () => useCalloutHighlightStore.getState().highlights;
const highlight = (fieldNames: string[], scope = SCOPE) =>
  act(() => useCalloutHighlightStore.getState().highlightFields(scope, fieldNames));
const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms));

describe("calloutHighlightStore", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useCalloutHighlightStore.setState({ highlights: {} });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("highlights the fields with the same token", () => {
    highlight([PRICE, TAX]);

    const scopeHighlights = getHighlights()[SCOPE];
    expect(Object.keys(scopeHighlights)).toEqual([PRICE, TAX]);
    expect(scopeHighlights[PRICE]).toBe(scopeHighlights[TAX]);
  });

  it("clears the highlight when the fade duration ends", () => {
    highlight([PRICE]);

    advance(CALLOUT_HIGHLIGHT_DURATION_MS - 1);
    expect(getHighlights()[SCOPE][PRICE]).toBeDefined();

    advance(1);
    expect(getHighlights()[SCOPE]).toBeUndefined();
  });

  it("restarts the highlight of a field changed again before it ends", () => {
    highlight([PRICE, TAX]);
    const firstToken = getHighlights()[SCOPE][PRICE];
    advance(CALLOUT_HIGHLIGHT_DURATION_MS / 2);

    highlight([PRICE]);
    const secondToken = getHighlights()[SCOPE][PRICE];
    expect(secondToken).not.toBe(firstToken);

    advance(CALLOUT_HIGHLIGHT_DURATION_MS / 2);
    expect(getHighlights()[SCOPE]).toEqual({ [PRICE]: secondToken });

    advance(CALLOUT_HIGHLIGHT_DURATION_MS / 2);
    expect(getHighlights()[SCOPE]).toBeUndefined();
  });

  it("ends a highlight whose scope was already cleared", () => {
    highlight([PRICE]);
    useCalloutHighlightStore.setState({ highlights: {} });

    advance(CALLOUT_HIGHLIGHT_DURATION_MS);

    expect(getHighlights()).toEqual({});
  });

  it("does not change the state when no field changed", () => {
    const before = getHighlights();

    highlight([]);

    expect(getHighlights()).toBe(before);
  });

  it("keeps the scopes independent", () => {
    highlight([PRICE]);
    advance(CALLOUT_HIGHLIGHT_DURATION_MS / 2);
    highlight([PRICE], OTHER_SCOPE);

    advance(CALLOUT_HIGHLIGHT_DURATION_MS / 2);
    expect(getHighlights()[SCOPE]).toBeUndefined();
    expect(getHighlights()[OTHER_SCOPE][PRICE]).toBeDefined();
  });

  it("exposes the token of a highlighted field to the components", () => {
    const { result } = renderHook(() => useCalloutHighlightToken(SCOPE, PRICE));
    expect(result.current).toBeUndefined();

    highlight([PRICE]);
    expect(result.current).toBe(getHighlights()[SCOPE][PRICE]);

    advance(CALLOUT_HIGHLIGHT_DURATION_MS);
    expect(result.current).toBeUndefined();
  });
});
