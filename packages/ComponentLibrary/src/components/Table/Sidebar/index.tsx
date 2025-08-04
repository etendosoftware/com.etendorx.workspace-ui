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

import SidebarContent from "./SidebarContent";
import type { SidebarProps } from "./types";

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, selectedItem, widgets, translations }) => {
  return (
    <div className={`sidebar ${isOpen && "open"}`}>
      <SidebarContent
        icon={selectedItem.icon}
        identifier={selectedItem.identifier ?? translations.noIdentifier}
        title={selectedItem.title ?? translations.noTitle}
        widgets={widgets}
        onClose={onClose}
        translations={translations}
      />
    </div>
  );
};

export default Sidebar;
