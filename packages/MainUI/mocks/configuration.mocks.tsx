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
import CircleFilledIcon from "@workspaceui/componentlibrary/src/assets/icons/circle-filled.svg";
import CircleIcon from "@workspaceui/componentlibrary/src/assets/icons/circle.svg";
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

// Create a colored circle icon for the favicon badge selector
const createColorCircle = (color: string | null) => {
  if (!color) {
    return <CircleIcon fill="#9CA3AF" width="2rem" height="2rem" data-testid="CircleIcon__e5f973" />;
  }
  return <CircleFilledIcon fill={color} width="2rem" height="2rem" data-testid="CircleFilledIcon__e5f973" />;
};

// Map color items to include the colored CircleIcon
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
      itemsPerRow: 3,
    },
    {
      id: SECTION_TABLE_DENSITY_ID,
      name: "Table Density",
      items: TABLE_DENSITY_ITEMS,
      selectedItem: 0,
      isDisabled: true,
      itemsPerRow: 3,
    },
    {
      id: SECTION_COMMON_TOOLBAR_BUTTONS_ID,
      name: "Common Toolbar Buttons",
      items: COMMON_TOOLBAR_BUTTONS_ITEMS,
      selectedItem: 0,
      isDisabled: true,
      itemsPerRow: 3,
    },
    {
      id: SECTION_SPECIFIC_TOOLBAR_BUTTONS_ID,
      name: "Specific Toolbar Buttons",
      items: SPECIFIC_TOOLBAR_BUTTONS_ITEMS,
      selectedItem: 0,
      isDisabled: true,
      itemsPerRow: 3,
    },
    {
      id: SECTION_DENSITY_ID,
      name: "Interface scale",
      items: INTERFACE_SCALE_ITEMS,
      selectedItem: 1,
      isDisabled: false,
      itemsPerRow: 3,
    },
    {
      id: SECTION_FAVICON_BADGE_ID,
      name: "Favicon Badge",
      items: FAVICON_BADGE_ITEMS_WITH_IMG,
      selectedItem: 0,
      isDisabled: false,
      itemsPerRow: 4,
    },
  ],
  onChangeSelect: console.log,
};
