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

/**
 * Scrolls `container` by the least amount that puts `row` fully between the sticky table header and the
 * container's bottom edge; does nothing when the row is already there.
 *
 * Done with the DOM instead of the row virtualizer's `scrollToIndex`: the virtualizer measures rows from the
 * top of the body and ignores the sticky header (column titles and filter row), so its "auto" alignment
 * left the row hidden one header height below the visible area.
 */
export const scrollRowIntoContainer = (container: HTMLElement, row: HTMLElement): void => {
  const box = container.getBoundingClientRect();
  const header = container.querySelector("thead");
  const visibleTop = box.top + container.clientTop + (header ? header.getBoundingClientRect().height : 0);
  const visibleBottom = box.top + container.clientTop + container.clientHeight;
  const rowBox = row.getBoundingClientRect();

  if (rowBox.top < visibleTop) {
    container.scrollTop -= visibleTop - rowBox.top;
  } else if (rowBox.bottom > visibleBottom) {
    container.scrollTop += rowBox.bottom - visibleBottom;
  }
};
