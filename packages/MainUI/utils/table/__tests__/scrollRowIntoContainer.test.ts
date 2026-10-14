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

import { scrollRowIntoContainer } from "../scrollRowIntoContainer";

const rect = (top: number, height: number) => ({ top, bottom: top + height, height }) as DOMRect;

/** Container at y=200..800 (600 px visible), sticky header 80 px, rows 40 px high. */
const setup = (rowTop: number, withHeader = true) => {
  const container = document.createElement("div");
  Object.defineProperty(container, "clientHeight", { value: 600 });
  Object.defineProperty(container, "clientTop", { value: 0 });
  container.getBoundingClientRect = () => rect(200, 600);
  container.scrollTop = 500;
  if (withHeader) {
    const thead = document.createElement("thead");
    thead.getBoundingClientRect = () => rect(200, 80);
    container.appendChild(thead);
  }
  const row = document.createElement("tr");
  row.getBoundingClientRect = () => rect(rowTop, 40);
  return { container, row };
};

describe("scrollRowIntoContainer", () => {
  it("does not scroll when the row is visible", () => {
    const { container, row } = setup(400);
    scrollRowIntoContainer(container, row);
    expect(container.scrollTop).toBe(500);
  });

  it("scrolls down just enough to show a row below the bottom edge", () => {
    const { container, row } = setup(790); // bottom 830, 30 px below 800
    scrollRowIntoContainer(container, row);
    expect(container.scrollTop).toBe(530);
  });

  it("scrolls up so a row under the sticky header shows right below it", () => {
    const { container, row } = setup(250); // header ends at 280
    scrollRowIntoContainer(container, row);
    expect(container.scrollTop).toBe(470);
  });

  it("uses the container top when there is no header", () => {
    const { container, row } = setup(190, false);
    scrollRowIntoContainer(container, row);
    expect(container.scrollTop).toBe(490);
  });
});
