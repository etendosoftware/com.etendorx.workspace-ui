import { useState, useEffect } from 'react';
import { TABS_CONFIG } from './mock';
import SecondaryTabs from '../../../../../ComponentLibrary/src/components/SecondaryTabs';

export default {
  title: 'Components/SecondaryTabs',
  component: SecondaryTabs,
};

const SecondaryTabsTemplate = () => {
  const [tabsConfig, setTabsConfig] = useState(TABS_CONFIG);

  useEffect(() => {
    const timer = setTimeout(() => {
      const updatedTabs: any = tabsConfig.map(tab => ({
        ...tab,
        isLoading: false,
      }));
      setTabsConfig(updatedTabs);
    }, 5000);
    return () => clearTimeout(timer);
  }, [tabsConfig]);

  return <SecondaryTabs tabsConfig={tabsConfig} />;
};

export const Default = () => <SecondaryTabsTemplate />;
