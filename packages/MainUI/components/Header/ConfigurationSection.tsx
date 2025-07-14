"use client";
import { ConfigurationModal } from "@workspaceui/componentlibrary/src/components";
import { modalConfig } from "../../../storybook/src/mocks";
import { useTranslation } from "../../hooks/useTranslation";
import type { OptionSelectedProps } from "@workspaceui/componentlibrary/src/components/ConfigurationModal/types";
import {
  SECTION_DENSITY_TRANSFORM_SCALE_ID,
  SECTION_DENSITY_ZOOM_ID,
  SECTION_DENSITY_FONT_SIZE_ID,
  COMPACT_DENSITY_ID,
  STANDARD_DENSITY_ID,
  COMFORTABLE_DENSITY_ID,
} from "@workspaceui/componentlibrary/src/components/ConfigurationModal/constants";

const ConfigurationSection: React.FC = () => {
  const { t } = useTranslation();

  const handleSelectOption = (optionSelected: OptionSelectedProps) => {
    const { sectionId } = optionSelected;
    const { id: optionSelectedId } = optionSelected;
    const layoutElement = document.getElementById("layout");
    if (sectionId === SECTION_DENSITY_TRANSFORM_SCALE_ID) {
      switch (optionSelectedId) {
        case COMPACT_DENSITY_ID:
          layoutElement?.classList.remove("standard-view-transform-scale");
          layoutElement?.classList.remove("comfortable-view-transform-scale");
          layoutElement?.classList.add("compact-view-transform-scale");
          break;
        case STANDARD_DENSITY_ID:
          layoutElement?.classList.remove("compact-view-transform-scale");
          layoutElement?.classList.remove("comfortable-view-transform-scale");
          layoutElement?.classList.add("standard-view-transform-scale");
          break;
        case COMFORTABLE_DENSITY_ID:
          layoutElement?.classList.remove("compact-view-transform-scale");
          layoutElement?.classList.remove("standard-view-transform-scale");
          layoutElement?.classList.add("comfortable-view-transform-scale");
          break;
      }
    }
    if (sectionId === SECTION_DENSITY_ZOOM_ID) {
      switch (optionSelectedId) {
        case COMPACT_DENSITY_ID:
          layoutElement?.classList.remove("standard-view-zoom");
          layoutElement?.classList.remove("comfortable-view-zoom");
          layoutElement?.classList.add("compact-view-zoom");
          break;
        case STANDARD_DENSITY_ID:
          layoutElement?.classList.remove("compact-view-zoom");
          layoutElement?.classList.remove("comfortable-view-zoom");
          layoutElement?.classList.add("standard-view-zoom");
          break;
        case COMFORTABLE_DENSITY_ID:
          layoutElement?.classList.remove("compact-view-zoom");
          layoutElement?.classList.remove("standard-view-zoom");
          layoutElement?.classList.add("comfortable-view-zoom");
          break;
      }
    }
    if (sectionId === SECTION_DENSITY_FONT_SIZE_ID) {
      switch (optionSelectedId) {
        case COMPACT_DENSITY_ID:
          layoutElement?.classList.remove("standard-view-font-size");
          layoutElement?.classList.remove("comfortable-view-font-size");
          layoutElement?.classList.add("compact-view-font-size");
          break;
        case STANDARD_DENSITY_ID:
          layoutElement?.classList.remove("compact-view-font-size");
          layoutElement?.classList.remove("comfortable-view-font-size");
          layoutElement?.classList.add("standard-view-font-size");
          break;
        case COMFORTABLE_DENSITY_ID:
          layoutElement?.classList.remove("compact-view-font-size");
          layoutElement?.classList.remove("standard-view-font-size");
          layoutElement?.classList.add("comfortable-view-font-size");
          break;
      }
    }
  };

  return (
    <ConfigurationModal
      {...modalConfig}
      tooltipButtonProfile={t("navigation.configurationModal.tooltipButtonProfile")}
      onChangeSelect={handleSelectOption}
    />
  );
};

export default ConfigurationSection;
