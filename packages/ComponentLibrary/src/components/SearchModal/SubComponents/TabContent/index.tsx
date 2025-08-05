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

import type React from "react";
import { SectionContent } from "../SectionContent";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const TabContent: React.FC<{ tabsContent: any[]; activeTab: number }> = ({ tabsContent, activeTab }) => {
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
  }
  const activeTabConfig = tabsContent[activeTab];
  return (
    <SectionContent
      section={{ title: activeTabConfig.label, items: activeTabConfig.items }}
      isLast={true}
      variant="tabs"
    />
  );
};
