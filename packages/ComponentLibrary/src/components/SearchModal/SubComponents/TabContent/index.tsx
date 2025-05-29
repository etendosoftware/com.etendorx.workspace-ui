import type React from 'react';
import { SectionContent } from '../SectionContent';

export const TabContent: React.FC<{ tabsContent: any[], activeTab: number }> =
  ({ tabsContent, activeTab }) => {
    if (activeTab === 0) {
      return (
        <>
          {tabsContent.slice(1).map((tab, index) => (
            <SectionContent
              key={index}
              section={{ title: tab.label, items: tab.items }}
              isLast={index === tabsContent.length - 2}
              variant="tabs"
            />
          ))}
        </>
      );
    } else {
      const activeTabConfig = tabsContent[activeTab];
      return (
        <SectionContent
          section={{ title: activeTabConfig.label, items: activeTabConfig.items }}
          isLast={true}
          variant="tabs"
        />
      );
    }
  };
