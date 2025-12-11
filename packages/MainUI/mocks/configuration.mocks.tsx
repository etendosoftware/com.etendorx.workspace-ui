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

import SettingIcon from "@workspaceui/componentlibrary/src/assets/icons/settings.svg";
import {
  SECTION_THEME_ID,
  SECTION_TABLE_DENSITY_ID,
  SECTION_COMMON_TOOLBAR_BUTTONS_ID,
  SECTION_SPECIFIC_TOOLBAR_BUTTONS_ID,
  SECTION_DENSITY_ID,
  SECTION_FAVICON_BADGE_ID,
  INTERFACE_SCALE_ITEMS,
  THEME_ITEMS,
  TABLE_DENSITY_ITEMS,
  COMMON_TOOLBAR_BUTTONS_ITEMS,
  SPECIFIC_TOOLBAR_BUTTONS_ITEMS,
  FAVICON_BADGE_COLOR_ITEMS,
} from "@workspaceui/componentlibrary/src/components/ConfigurationModal/constants";

// Generate a colored circle SVG as data URI for the favicon badge selector
const createColorCircle = (color: string | null) => {
  if (!color) {
    // "None" option: show a circle with a diagonal line through it
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="none" stroke="#9CA3AF" stroke-width="2"/>
        <line x1="6" y1="6" x2="26" y2="26" stroke="#9CA3AF" stroke-width="2"/>
      </svg>`
    )}`;
  }
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14" fill="${color}" stroke="#fff" stroke-width="2"/>
    </svg>`
  )}`;
};

// Map color items to include the generated img
const FAVICON_BADGE_ITEMS_WITH_IMG = FAVICON_BADGE_COLOR_ITEMS.map((item) => ({
  ...item,
  img: createColorCircle(item.color),
}));

export const modalConfig = {
  icon: <SettingIcon data-testid="SettingIcon__e5f973" />,
  title: {
    icon: <SettingIcon fill="var(--color-dynamic-main)" data-testid="SettingIcon__e5f973" />,
    label: "Quick Setup",
  },
  linkTitle: { label: "View all settings", url: "/settings" },
  sections: [
    {
      id: SECTION_THEME_ID,
      name: "Theme",
      items: THEME_ITEMS,
      selectedItem: 0,
      isDisabled: true,
    },
    {
      id: SECTION_TABLE_DENSITY_ID,
      name: "Table Density",
      items: TABLE_DENSITY_ITEMS,
      selectedItem: 0,
      isDisabled: true,
    },
    {
      id: SECTION_COMMON_TOOLBAR_BUTTONS_ID,
      name: "Common Toolbar Buttons",
      items: COMMON_TOOLBAR_BUTTONS_ITEMS,
      selectedItem: 0,
      isDisabled: true,
    },
    {
      id: SECTION_SPECIFIC_TOOLBAR_BUTTONS_ID,
      name: "Specific Toolbar Buttons",
      items: SPECIFIC_TOOLBAR_BUTTONS_ITEMS,
      selectedItem: 0,
      isDisabled: true,
    },
    {
      id: SECTION_DENSITY_ID,
      name: "Interface scale",
      items: INTERFACE_SCALE_ITEMS,
      selectedItem: 1,
      isDisabled: false,
    },
    {
      id: SECTION_FAVICON_BADGE_ID,
      name: "Favicon Badge",
      items: FAVICON_BADGE_ITEMS_WITH_IMG,
      selectedItem: 0,
      isDisabled: false,
    },
  ],
  onChangeSelect: console.log,
};
