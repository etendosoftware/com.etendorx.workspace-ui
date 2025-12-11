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

"use client";
import { useState, useEffect, useMemo } from "react";
import { ConfigurationModal } from "@workspaceui/componentlibrary/src/components";
import { modalConfig } from "../../mocks";
import { useTranslation } from "../../hooks/useTranslation";
import type {
  OptionSelectedProps,
  ISection,
  SectionItem,
} from "@workspaceui/componentlibrary/src/components/ConfigurationModal/types";
import {
  SECTION_DENSITY_ID,
  SMALL_INTERFACE_SCALE_ID,
  DEFAULT_INTERFACE_SCALE_ID,
  LARGE_INTERFACE_SCALE_ID,
  SECTION_THEME_ID,
  SECTION_TABLE_DENSITY_ID,
  SECTION_COMMON_TOOLBAR_BUTTONS_ID,
  SECTION_SPECIFIC_TOOLBAR_BUTTONS_ID,
  SECTION_FAVICON_BADGE_ID,
  FAVICON_BADGE_COLOR_ITEMS,
} from "@workspaceui/componentlibrary/src/components/ConfigurationModal/constants";
import { useLocalStorage } from "@workspaceui/componentlibrary/src/hooks/useLocalStorage";
import { DENSITY_KEY } from "@/utils/accessibility/constants";
import { usePreferences } from "@/contexts/preferences";

const DENSITY_STYLES_OPTIONS = { small: "small-scale", default: "default-scale", large: "large-scale" };

const ConfigurationSection: React.FC = () => {
  const { t } = useTranslation();
  const { customFaviconColor, setCustomFaviconColor } = usePreferences();
  const [density, setDensity] = useLocalStorage(DENSITY_KEY, "");
  const [sections, setSections] = useState<ISection[]>([]);

  const config = useMemo(() => {
    const translatedSections = modalConfig.sections.map((section) => {
      let name = section.name;
      let info: string | undefined = undefined;
      let items: SectionItem[] = section.items;

      if (section.id === SECTION_THEME_ID) {
        name = t("configuration.themes.title");
        items = items.map((item) => ({
          ...item,
          label: t(`configuration.themes.${item.id}` as any),
        }));
      } else if (section.id === SECTION_TABLE_DENSITY_ID) {
        name = t("configuration.tableDensity.title");
        items = items.map((item) => ({
          ...item,
          label: t(`configuration.tableDensity.${item.id.replace("table-density-", "")}` as any),
        }));
      } else if (section.id === SECTION_COMMON_TOOLBAR_BUTTONS_ID) {
        name = t("configuration.commonToolbarButtons.title");
        items = items.map((item) => {
          const key = item.id.replace("common-", "").replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          return {
            ...item,
            label: t(`configuration.commonToolbarButtons.${key}` as any),
          };
        });
      } else if (section.id === SECTION_SPECIFIC_TOOLBAR_BUTTONS_ID) {
        name = t("configuration.specificToolbarButtons.title");
        items = items.map((item) => {
          // Adjust logic for specific button ids which might differ slightly or follow same pattern
          // specific-icon, specific-icon-and-text, specific-text
          const key = item.id.replace("specific-", "").replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          return {
            ...item,
            label: t(`configuration.specificToolbarButtons.${key}` as any),
          };
        });
      } else if (section.id === SECTION_DENSITY_ID) {
        name = t("configuration.interfaceScale.title");
        info = t("configuration.interfaceScale.info");
        items = items.map((item) => {
          let key = "default";
          if (item.id === SMALL_INTERFACE_SCALE_ID) key = "small";
          if (item.id === LARGE_INTERFACE_SCALE_ID) key = "large";
          return {
            ...item,
            label: t(`configuration.interfaceScale.${key}` as any),
          };
        });
      } else if (section.id === SECTION_FAVICON_BADGE_ID) {
        name = t("configuration.faviconBadge.title");
        info = t("configuration.faviconBadge.info");
        items = items.map((item) => {
          const key = item.id.replace("favicon-badge-", "");
          return {
            ...item,
            label: t(`configuration.faviconBadge.${key}` as any),
          };
        });
      }

      return { ...section, name, info, items };
    });

    return {
      ...modalConfig,
      title: {
        ...modalConfig.title,
        label: t("configuration.quickSetup"),
      },
      linkTitle: {
        ...modalConfig.linkTitle,
        label: t("configuration.viewAllSettings"),
      },
      sections: translatedSections,
    };
  }, [t]);

  useEffect(() => {
    const initializedSections = config.sections.map((section) => {
      if (section.id === SECTION_DENSITY_ID) {
        const items = section.items;
        const selectedItemsIndex = items.findIndex((item) => item.id === density);
        return {
          ...section,
          selectedItem: selectedItemsIndex === -1 ? 1 : selectedItemsIndex,
        };
      }
      if (section.id === SECTION_FAVICON_BADGE_ID) {
        // Find selected item based on current favicon color
        const selectedIndex = FAVICON_BADGE_COLOR_ITEMS.findIndex((item) => item.color === customFaviconColor);
        return {
          ...section,
          selectedItem: selectedIndex === -1 ? 0 : selectedIndex,
        };
      }
      return section;
    });
    setSections(initializedSections);
  }, [density, config, customFaviconColor]);

  const handleSelectOption = (optionSelected: OptionSelectedProps) => {
    const { sectionId, id: optionSelectedId } = optionSelected;
    if (sectionId === SECTION_DENSITY_ID) {
      const rootElement = document.documentElement;
      rootElement.classList.remove(...Object.values(DENSITY_STYLES_OPTIONS));
      let newStyle = "";
      switch (optionSelectedId) {
        case SMALL_INTERFACE_SCALE_ID:
          newStyle = DENSITY_STYLES_OPTIONS.small;
          break;
        case DEFAULT_INTERFACE_SCALE_ID:
          newStyle = DENSITY_STYLES_OPTIONS.default;
          break;
        case LARGE_INTERFACE_SCALE_ID:
          newStyle = DENSITY_STYLES_OPTIONS.large;
          break;
      }
      rootElement.classList.add(newStyle);
      setDensity(newStyle);
      try {
        // Persist also in a cookie so SSR can read and match the class
        const maxAge = 60 * 60 * 24 * 365; // 1 year
        document.cookie = `${DENSITY_KEY}=${encodeURIComponent(newStyle)}; path=/; max-age=${maxAge}`;
      } catch (_) {
        // no-op
      }
    }

    // Handle favicon badge color selection
    if (sectionId === SECTION_FAVICON_BADGE_ID) {
      const selectedColorItem = FAVICON_BADGE_COLOR_ITEMS.find((item) => item.id === optionSelectedId);
      if (selectedColorItem) {
        setCustomFaviconColor(selectedColorItem.color);
      }
    }
  };

  return (
    <ConfigurationModal
      {...config}
      sections={sections}
      tooltipButtonProfile={t("navigation.configurationModal.tooltipButtonProfile")}
      onChangeSelect={handleSelectOption}
      data-testid="ConfigurationModal__d44cf2"
    />
  );
};

export default ConfigurationSection;
