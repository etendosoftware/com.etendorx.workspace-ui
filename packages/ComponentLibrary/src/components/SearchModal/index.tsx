import { Box } from '@mui/material';
import { useState } from 'react';
import SecondaryTabs from '../SecondaryTabs';
import type { SearchModalProps } from '../SecondaryTabs/types';
import { DefaultContent } from './SubComponents/DefaultContent';
import { HeaderSection } from './SubComponents/HeaderSection';
import { TabContent as TabContentComponent } from './SubComponents/TabContent';
import { DEFAULT_MODAL_WIDTH, useStyle } from './styles';

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
    }
    if (variant === 'tabs' && tabsContent && tabsContent.length > 0) {
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
