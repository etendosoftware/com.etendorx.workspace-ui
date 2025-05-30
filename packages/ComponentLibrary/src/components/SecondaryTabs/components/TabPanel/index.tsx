import type React from "react";
import { Box } from "@mui/material";
import type { TabPanelProps } from "./types";

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <Box role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </Box>
  );
};

export default TabPanel;
