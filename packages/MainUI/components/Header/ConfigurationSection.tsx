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
  COMPACT_DENSITY_ID,
  STANDARD_DENSITY_ID,
  COMFORTABLE_DENSITY_ID,
} from "@workspaceui/componentlibrary/src/components/ConfigurationModal/constants";
import { useLocalStorage } from "@workspaceui/componentlibrary/src/hooks/useLocalStorage";
import { DENSITY_KEY } from "@/utils/accessibility/constants";

const DENSITY_STYLES_OPTIONS = { compact: "compact-view", standard: "standard-view", comfortable: "comfortable-view" };

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
          selectedItem: selectedItemsIndex,
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
        case COMPACT_DENSITY_ID:
          newStyle = DENSITY_STYLES_OPTIONS.compact;
          break;
        case STANDARD_DENSITY_ID:
          newStyle = DENSITY_STYLES_OPTIONS.standard;
          break;
        case COMFORTABLE_DENSITY_ID:
          newStyle = DENSITY_STYLES_OPTIONS.comfortable;
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
