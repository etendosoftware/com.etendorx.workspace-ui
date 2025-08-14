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

import { Box } from "@mui/material";
import { useState } from "react";
import SecondaryTabs from "../SecondaryTabs";
import type { SearchModalProps } from "../SecondaryTabs/types";
import { DefaultContent } from "./SubComponents/DefaultContent";
import { HeaderSection } from "./SubComponents/HeaderSection";
import { TabContent as TabContentComponent } from "./SubComponents/TabContent";
import { DEFAULT_MODAL_WIDTH, useStyle } from "./styles";

const SearchModal: React.FC<SearchModalProps> = ({
  defaultContent,
  tabsContent,
  variant,
  modalWidth = DEFAULT_MODAL_WIDTH,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const { sx } = useStyle();

  const renderContent = () => {
    if (variant === "default" && defaultContent) {
      return (
        <>
          <HeaderSection title={defaultContent.headerTitle} />
          <DefaultContent sections={defaultContent.sections} />
        </>
      );
    }
    if (variant === "tabs" && tabsContent && tabsContent.length > 0) {
      return (
        <>
          <SecondaryTabs content={tabsContent} selectedTab={activeTab} onChange={setActiveTab} />
          <TabContentComponent tabsContent={tabsContent} activeTab={activeTab} />
        </>
      );
    }
    return null;
  };

  return (
    <Box sx={[sx.container, { width: modalWidth }]}>
      <Box sx={sx.content(variant)}>{renderContent()}</Box>
    </Box>
  );
};

export default SearchModal;
