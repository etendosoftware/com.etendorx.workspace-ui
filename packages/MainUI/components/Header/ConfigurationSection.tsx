"use client";
import { ConfigurationModal } from "@workspaceui/componentlibrary/src/components";
import { modalConfig } from "../../../storybook/src/mocks";
import { useTranslation } from "../../hooks/useTranslation";
import type { OptionSelectedProps } from "@workspaceui/componentlibrary/src/components/ConfigurationModal/types";
import {
  SECTION_DENSITY_ID,
  COMPACT_DENSITY_ID,
  STANDARD_DENSITY_ID,
  COMFORTABLE_DENSITY_ID,
} from "@workspaceui/componentlibrary/src/components/ConfigurationModal/constants";

const ConfigurationSection: React.FC = () => {
  const { t } = useTranslation();

  const handleSelectOption = (optionSelected: OptionSelectedProps) => {
    const { sectionId } = optionSelected;
    if (sectionId === SECTION_DENSITY_ID) {
      const { id: optionSelectedId } = optionSelected;
      const layoutElement = document.getElementById("layout");
      switch (optionSelectedId) {
        case COMPACT_DENSITY_ID:
          layoutElement?.classList.remove("standard-view");
          layoutElement?.classList.remove("comfortable-view");
          layoutElement?.classList.add("compact-view");
          break;
        case STANDARD_DENSITY_ID:
          layoutElement?.classList.remove("compact-view");
          layoutElement?.classList.remove("comfortable-view");
          layoutElement?.classList.add("standard-view");
          break;
        case COMFORTABLE_DENSITY_ID:
          layoutElement?.classList.remove("compact-view");
          layoutElement?.classList.remove("standard-view");
          layoutElement?.classList.add("comfortable-view");
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
