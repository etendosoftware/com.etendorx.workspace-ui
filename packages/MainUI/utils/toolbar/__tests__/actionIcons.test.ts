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

import { resolveToolbarIcon, toIconDataUri } from "@/utils/toolbar/actionIcons";
import { TOOLBAR_BUTTONS_ACTIONS } from "@/utils/toolbar/constants";

const STORED_ICON = "c3RvcmVkLWljb24tZnJvbS10aGUtZGF0YWJhc2U=";
const SVG_DATA_URI_PREFIX = "data:image/svg+xml";

/** Decodes the SVG markup of a data URI built by `toIconDataUri`. */
const decodeSvg = (uri: string) => decodeURIComponent(uri.slice(uri.indexOf(",") + 1));

describe("resolveToolbarIcon", () => {
  it.each([
    TOOLBAR_BUTTONS_ACTIONS.EXPORT_CSV,
    TOOLBAR_BUTTONS_ACTIONS.ADVANCED_FILTERS,
    TOOLBAR_BUTTONS_ACTIONS.TAB_CONTROL,
    TOOLBAR_BUTTONS_ACTIONS.SHOW_TABLE_AND_FORM,
  ])("replaces the stored icon of %s with a monochrome outline SVG", (action) => {
    const icon = resolveToolbarIcon(action, STORED_ICON) as string;

    expect(icon.startsWith(SVG_DATA_URI_PREFIX)).toBe(true);
    expect(decodeSvg(icon)).toContain('fill="#102030"');
  });

  it("keeps the stored icon of any other action", () => {
    expect(resolveToolbarIcon(TOOLBAR_BUTTONS_ACTIONS.FIND, STORED_ICON)).toBe(STORED_ICON);
  });

  it("keeps the stored icon of a custom button added by a module", () => {
    expect(resolveToolbarIcon("CUSTOM_MODULE_ACTION", null)).toBeNull();
  });
});

describe("toIconDataUri", () => {
  it("wraps the path in a 24x24 even-odd SVG", () => {
    const svg = decodeSvg(toIconDataUri("M0 0h1v1H0Z"));

    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain('fill-rule="evenodd"');
    expect(svg).toContain('d="M0 0h1v1H0Z"');
  });
});
