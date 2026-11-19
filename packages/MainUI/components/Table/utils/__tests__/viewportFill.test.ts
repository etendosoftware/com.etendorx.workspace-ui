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

import { isGridBottomReached, isGridViewportUnfilled } from "../viewportFill";

const CLIENT_HEIGHT = 400;

describe("isGridBottomReached", () => {
  it("is true at the bottom of a scrollable grid", () => {
    expect(isGridBottomReached({ scrollHeight: 1000, scrollTop: 595, clientHeight: CLIENT_HEIGHT })).toBe(true);
  });

  it.each([
    ["far from the bottom", { scrollHeight: 1000, scrollTop: 100, clientHeight: CLIENT_HEIGHT }],
    ["without a scroll bar", { scrollHeight: CLIENT_HEIGHT, scrollTop: 0, clientHeight: CLIENT_HEIGHT }],
    ["hidden", { scrollHeight: 0, scrollTop: 0, clientHeight: 0 }],
  ])("is false %s", (_case, metrics) => {
    expect(isGridBottomReached(metrics)).toBe(false);
  });
});

describe("isGridViewportUnfilled", () => {
  it("is true when the rows do not fill the visible grid", () => {
    expect(isGridViewportUnfilled({ scrollHeight: 300, clientHeight: CLIENT_HEIGHT })).toBe(true);
    expect(isGridViewportUnfilled({ scrollHeight: CLIENT_HEIGHT, clientHeight: CLIENT_HEIGHT })).toBe(true);
  });

  it("is false with a scroll bar or a hidden grid", () => {
    expect(isGridViewportUnfilled({ scrollHeight: 1000, clientHeight: CLIENT_HEIGHT })).toBe(false);
    expect(isGridViewportUnfilled({ scrollHeight: 0, clientHeight: 0 })).toBe(false);
  });
});
