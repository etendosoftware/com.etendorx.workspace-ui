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
 * @fileoverview Shared look of the grid and toolbar menus (row, header, Save View and process menus), so they use the
 * same text size as the grid and separators that span the whole menu.
 */

/** Text size of the menu entries: the 13px of the grid text. */
export const MENU_TEXT_CLASS = "text-[0.8125rem]";

/** Content box of a menu; its entries inherit the text size. */
export const MENU_CONTENT_CLASSES = `rounded-2xl px-2 py-4 ${MENU_TEXT_CLASS}`;

/** Content box of a sub-menu. */
export const SUB_MENU_CONTENT_CLASSES = `rounded-2xl px-2 py-2 ${MENU_TEXT_CLASS}`;

/** Separator that crosses the side padding of the content box, so it spans the menu width. */
export const MENU_SEPARATOR_CLASSES = "-mx-2 my-2 border-t border-(--color-transparent-neutral-30)";
