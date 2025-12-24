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

import ThemeLightUrl from "../../assets/images/ConfigurationModal/theme-light.svg?url";
import ThemeDarkUrl from "../../assets/images/ConfigurationModal/theme-dark.svg?url";
import ThemeAutomaticUrl from "../../assets/images/ConfigurationModal/theme-automatic.svg?url";
import DensityCompactUrl from "../../assets/images/ConfigurationModal/density-compact.svg?url";
import DensityStandardUrl from "../../assets/images/ConfigurationModal/density-standard.svg?url";
import DensityComfortableUrl from "../../assets/images/ConfigurationModal/density-comfortable.svg?url";
import CommonToolbarIconUrl from "../../assets/images/ConfigurationModal/common-toolbar-buttons-icon.svg?url";
import CommonToolbarTextUrl from "../../assets/images/ConfigurationModal/common-toolbar-buttons-text.svg?url";
import CommonToolbarIconTextUrl from "../../assets/images/ConfigurationModal/common-toolbar-buttons-icon-and-text.svg?url";
import SpecificToolbarIconUrl from "../../assets/images/ConfigurationModal/specific-toolbar buttons-icon.svg?url";
import SpecificToolbarIconTextUrl from "../../assets/images/ConfigurationModal/specific-toolbar buttons-icon-and-text.svg?url";
import SpecificToolbarTextUrl from "../../assets/images/ConfigurationModal/specific-toolbar buttons-text.svg?url";
import InterfaceScaleSmallUrl from "../../assets/images/ConfigurationModal/interface-scale-small.svg?url";
import InterfaceScaleDefaultUrl from "../../assets/images/ConfigurationModal/interface-scale-default.svg?url";
import InterfaceScaleLargeUrl from "../../assets/images/ConfigurationModal/interface-scale-large.svg?url";

export const SECTION_THEME_ID = "theme";
export const SECTION_TABLE_DENSITY_ID = "tableDensity";
export const SECTION_COMMON_TOOLBAR_BUTTONS_ID = "commonToolbarButtons";
export const SECTION_SPECIFIC_TOOLBAR_BUTTONS_ID = "specificToolbarButtons";
export const SECTION_DENSITY_ID = "density";

export const THEME_ITEMS = [
  { img: ThemeLightUrl, id: "light", label: "Light" },
  { img: ThemeDarkUrl, id: "dark", label: "Dark" },
  { img: ThemeAutomaticUrl, id: "automatic", label: "Automatic" },
];

export const TABLE_DENSITY_ITEMS = [
  { img: DensityCompactUrl, id: "table-density-compact", label: "Compact" },
  { img: DensityStandardUrl, id: "table-density-standard", label: "Standard" },
  { img: DensityComfortableUrl, id: "table-density-comfortable", label: "Comfortable" },
];

export const COMMON_TOOLBAR_BUTTONS_ITEMS = [
  { img: CommonToolbarIconUrl, id: "common-icon", label: "Icon" },
  { img: CommonToolbarTextUrl, id: "common-text", label: "Text" },
  { img: CommonToolbarIconTextUrl, id: "common-icon-and-text", label: "Icon and Text" },
];

export const SPECIFIC_TOOLBAR_BUTTONS_ITEMS = [
  { img: SpecificToolbarIconUrl, id: "specific-icon", label: "Icon" },
  { img: SpecificToolbarIconTextUrl, id: "specific-icon-and-text", label: "Icon and Text" },
  { img: SpecificToolbarTextUrl, id: "specific-text", label: "Text" },
];

export const SMALL_INTERFACE_SCALE_ID = "small-scale";
export const DEFAULT_INTERFACE_SCALE_ID = "default-scale";
export const LARGE_INTERFACE_SCALE_ID = "large-scale";

export const INTERFACE_SCALE_ITEMS = [
  { img: InterfaceScaleSmallUrl, id: SMALL_INTERFACE_SCALE_ID, label: "Small" },
  { img: InterfaceScaleDefaultUrl, id: DEFAULT_INTERFACE_SCALE_ID, label: "Default" },
  { img: InterfaceScaleLargeUrl, id: LARGE_INTERFACE_SCALE_ID, label: "Large" },
];

export const SECTION_FAVICON_BADGE_ID = "faviconBadge";

// 10 colors that contrast well with #fad614 (Etendo yellow) + None option
export const FAVICON_BADGE_COLOR_ITEMS = [
  { id: "favicon-badge-none", color: null, label: "None" },
  { id: "favicon-badge-red", color: "#E53935", label: "Red" },
  { id: "favicon-badge-pink", color: "#D81B60", label: "Pink" },
  { id: "favicon-badge-purple", color: "#8E24AA", label: "Purple" },
  { id: "favicon-badge-blue", color: "#1E88E5", label: "Blue" },
  { id: "favicon-badge-navy", color: "#1A237E", label: "Navy" },
  { id: "favicon-badge-cyan", color: "#00ACC1", label: "Cyan" },
  { id: "favicon-badge-teal", color: "#00897B", label: "Teal" },
  { id: "favicon-badge-green", color: "#43A047", label: "Green" },
  { id: "favicon-badge-orange", color: "#FB8C00", label: "Orange" },
  { id: "favicon-badge-brown", color: "#6D4C41", label: "Brown" },
  { id: "favicon-badge-gray", color: "#757575", label: "Gray" },
];
