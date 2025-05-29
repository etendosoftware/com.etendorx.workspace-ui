import { useState } from 'react';
import { Box } from '@mui/material';
import SecondaryTabs from '../SecondaryTabs';
import type { SearchModalProps } from '../SecondaryTabs/types';
import { DEFAULT_MODAL_WIDTH, useStyle } from './styles';
import { HeaderSection } from './SubComponents/HeaderSection';
import { DefaultContent } from './SubComponents/DefaultContent';
import { TabContent as TabContentComponent } from './SubComponents/TabContent';

const SearchModal: React.FC<SearchModalProps> = ({
  defaultContent,
  tabsContent,
  variant,
  modalWidth = DEFAULT_MODAL_WIDTH,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const { sx } = useStyle();

  const renderContent = () => {
    if (variant === 'default' && defaultContent) {
      return (
        <>
          <HeaderSection title={defaultContent.headerTitle} />
          <DefaultContent sections={defaultContent.sections} />
        </>
      );
    } else if (variant === 'tabs' && tabsContent && tabsContent.length > 0) {
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
