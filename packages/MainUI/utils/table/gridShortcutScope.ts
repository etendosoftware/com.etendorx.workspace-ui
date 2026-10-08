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

import { GRID_FOCUS_TARGET_ATTRIBUTE } from "@/utils/window/splitView";

/**
 * Surfaces of a grid a keyboard shortcut can be scoped to, as classic `OBGrid.body` and
 * `OBGrid.filter`: the rows, and the filter row rendered in the table header.
 */

const HEADER_SELECTOR = "thead";
const GRID_SELECTOR = `[${GRID_FOCUS_TARGET_ATTRIBUTE}]`;

/**
 * The element the key press comes from when it lies inside the grid: `container` when given,
 * otherwise the closest grid on the page.
 */
const getGridElement = (target: EventTarget | null, container?: Element | null): Element | null => {
  if (!(target instanceof Element)) return null;
  const grid = container === undefined ? target.closest(GRID_SELECTOR) : container;
  return grid?.contains(target) ? target : null;
};

/** True when the key press comes from anywhere inside the grid: rows or filter row. */
export function isGridTarget(target: EventTarget | null, container?: Element | null): boolean {
  return Boolean(getGridElement(target, container));
}

/** True when the key press comes from the grid itself or one of its rows, not from its header. */
export function isGridBodyTarget(target: EventTarget | null, container?: Element | null): boolean {
  const element = getGridElement(target, container);
  return Boolean(element) && !element?.closest(HEADER_SELECTOR);
}

/** True when the key press comes from the header of the grid, where its filter row lives. */
export function isGridHeaderTarget(target: EventTarget | null, container?: Element | null): boolean {
  return Boolean(getGridElement(target, container)?.closest(HEADER_SELECTOR));
}

/** The first enabled text field of the grid filter row, if the row is shown. */
export function findFirstFilterInput(container: Element | null): HTMLElement | null {
  return container?.querySelector<HTMLElement>(`${HEADER_SELECTOR} input:not([disabled])`) ?? null;
}
