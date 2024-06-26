import * as React from 'react';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { TabContent } from '../../interfaces';
import { theme } from '../../theme';

interface TabsMUIProps {
  tabArray: TabContent[];
}
const TabsMUI = ({ tabArray }: TabsMUIProps) => {
  const [value, setValue] = React.useState('0');

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', backgroundColor: theme.palette.dynamicColor.contrastText }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList
            onChange={handleChange}
            aria-label="lab API tabs example"
            textColor="primary"
            indicatorColor="primary"
            variant="scrollable"
            scrollButtons
            allowScrollButtonsMobile>
            {tabArray.map((tab, index) => (
              <Tab key={index} label={tab.title} value={`${index}`} />
            ))}
          </TabList>
        </Box>

        {tabArray.map((tab, index) => (
          <TabPanel key={index} value={`${index}`} sx={{ height: '100%' }}>
            {tab.children}
          </TabPanel>
        ))}
      </TabContext>
    </Box>
  );
};

export default TabsMUI;
