import ThemeLightUrl from "../..//assets/images/ConfigurationModal/theme-light.svg?url";
import ThemeDarkUrl from "../..//assets/images/ConfigurationModal/theme-dark.svg?url";
import ThemeAutomaticUrl from "../..//assets/images/ConfigurationModal/theme-automatic.svg?url";
import DensityCompactUrl from "../..//assets/images/ConfigurationModal/density-compact.svg?url";
import DensityStandardUrl from "../..//assets/images/ConfigurationModal/density-standard.svg?url";
import DensityComfortableUrl from "../..//assets/images/ConfigurationModal/density-comfortable.svg?url";
import CommonToolbarIconUrl from "../..//assets/images/ConfigurationModal/common-toolbar-buttons-icon.svg?url";
import CommonToolbarTextUrl from "../..//assets/images/ConfigurationModal/common-toolbar-buttons-text.svg?url";
import CommonToolbarIconTextUrl from "../..//assets/images/ConfigurationModal/common-toolbar-buttons-icon-and-text.svg?url";
import SpecificToolbarIconUrl from "../..//assets/images/ConfigurationModal/specific-toolbar buttons-icon.svg?url";
import SpecificToolbarIconTextUrl from "../..//assets/images/ConfigurationModal/specific-toolbar buttons-icon-and-text.svg?url";
import SpecificToolbarTextUrl from "../..//assets/images/ConfigurationModal/specific-toolbar buttons-text.svg?url";

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

export const COMPACT_DENSITY_ID = "compact-view";
export const STANDARD_DENSITY_ID = "standard-view";
export const COMFORTABLE_DENSITY_ID = "comfortable-view";

export const DENSITY_ITEMS = [
  { img: DensityCompactUrl, id: COMPACT_DENSITY_ID, label: "Compact" },
  { img: DensityStandardUrl, id: STANDARD_DENSITY_ID, label: "Standard" },
  { img: DensityComfortableUrl, id: COMFORTABLE_DENSITY_ID, label: "Comfortable" },
];
