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

import * as React from "react";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import type { TabContent } from "../../interfaces";
import { useTheme } from "@mui/material";

interface TabsMUIProps {
  tabArray: TabContent[];
}
const TabsMUI = ({ tabArray }: TabsMUIProps) => {
  const [value, setValue] = React.useState("0");
  const theme = useTheme();

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%", height: "100%", backgroundColor: theme.palette.dynamicColor.contrastText }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList
            onChange={handleChange}
            aria-label="lab API tabs example"
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons
            allowScrollButtonsMobile>
            {tabArray.map((tab, index) => (
              <Tab key={tab.title} label={tab.title} value={`${index}`} />
            ))}
          </TabList>
        </Box>

        {tabArray.map((tab, index) => (
          <TabPanel key={tab.title} value={`${index}`} sx={{ height: "100%" }}>
            {tab.children}
          </TabPanel>
        ))}
      </TabContext>
    </Box>
  );
};

export default TabsMUI;
