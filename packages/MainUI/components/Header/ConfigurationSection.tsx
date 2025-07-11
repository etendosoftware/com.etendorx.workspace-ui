"use client";
import { ConfigurationModal } from "@workspaceui/componentlibrary/src/components";
import { modalConfig } from "../../../storybook/src/mocks";
import { useTranslation } from "../../hooks/useTranslation";
import type { OptionSelectedProps } from "@workspaceui/componentlibrary/src/components/ConfigurationModal/types";
import { SECTION_THEME_ID } from "@workspaceui/componentlibrary/src/components/ConfigurationModal/constants";

const ConfigurationSection: React.FC = () => {
  const { t } = useTranslation();

  const handleSelectOption = (optionSelected: OptionSelectedProps) => {
    console.log("optionSelected", optionSelected);
    const { sectionId } = optionSelected;
    if (sectionId === SECTION_THEME_ID) {
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
