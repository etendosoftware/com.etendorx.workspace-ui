import { useState, useEffect } from 'react';
import { TABS_CONFIG } from './mock';
import SecondaryTabs from '../../../../../ComponentLibrary/src/components/SecondaryTabs';

export default {
  title: 'Components/SecondaryTabs',
  component: SecondaryTabs,
};

const SecondaryTabsTemplate = () => {
  const [tabsContent, setTabsContent] = useState(TABS_CONFIG);

  useEffect(() => {
    const timer = setTimeout(() => {
      const updatedTabs: any = tabsContent.map(tab => ({
        ...tab,
        isLoading: false,
      }));
      setTabsContent(updatedTabs);
    }, 5000);
    return () => clearTimeout(timer);
  }, [tabsContent]);

  return <SecondaryTabs tabsContent={tabsContent} />;
};

export const Default = () => <SecondaryTabsTemplate />;
