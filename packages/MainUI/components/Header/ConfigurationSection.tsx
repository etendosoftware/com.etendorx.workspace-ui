"use client";
import { useState, useEffect } from "react";
import { ConfigurationModal } from "@workspaceui/componentlibrary/src/components";
import { modalConfig } from "../../../storybook/src/mocks";
import { useTranslation } from "../../hooks/useTranslation";
import type {
  OptionSelectedProps,
  ISection,
} from "@workspaceui/componentlibrary/src/components/ConfigurationModal/types";
import {
  SECTION_DENSITY_ID,
  SMALL_INTERFACE_SCALE_ID,
  DEFAULT_INTERFACE_SCALE_ID,
  LARGE_INTERFACE_SCALE_ID,
} from "@workspaceui/componentlibrary/src/components/ConfigurationModal/constants";
import { useLocalStorage } from "@workspaceui/componentlibrary/src/hooks/useLocalStorage";
import { DENSITY_KEY } from "@/utils/accessibility/constants";

const DENSITY_STYLES_OPTIONS = { small: "small-scale", default: "default-scale", large: "large-scale" };

const ConfigurationSection: React.FC = () => {
  const { t } = useTranslation();
  const [density, setDensity] = useLocalStorage(DENSITY_KEY, "");
  const [sections, setSections] = useState<ISection[]>([]);

  useEffect(() => {
    const initializedSections = modalConfig.sections.map((section) => {
      if (section.id === SECTION_DENSITY_ID) {
        const items = section.items;
        const selectedItemsIndex = items.findIndex((item) => item.id === density);
        return {
          ...section,
          selectedItem: selectedItemsIndex === -1 ? 1 : selectedItemsIndex,
        };
      }
      return section;
    });
    setSections(initializedSections);
  }, [density]);

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
    }
  };

  return (
    <ConfigurationModal
      {...modalConfig}
      sections={sections}
      tooltipButtonProfile={t("navigation.configurationModal.tooltipButtonProfile")}
      onChangeSelect={handleSelectOption}
    />
  );
};

export default ConfigurationSection;
