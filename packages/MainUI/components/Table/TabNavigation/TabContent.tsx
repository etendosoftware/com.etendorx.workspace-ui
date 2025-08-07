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

import type { TabContentProps } from "./types";
import ChevronUp from "../../../../ComponentLibrary/src/assets/icons/chevron-up.svg";
import ChevronDown from "../../../../ComponentLibrary/src/assets/icons/chevron-down.svg";
import ChevronUpRight from "../../../../ComponentLibrary/src/assets/icons/chevron-right.svg";
import XCircle from "../../../../ComponentLibrary/src/assets/icons/x.svg";
import IconButton from "@workspaceui/componentlibrary/src/components/IconButton";

export const TabContent: React.FC<TabContentProps> = ({
  identifier,
  type,
  handleFullSize,
  isFullSize,
  isMainTab = false,
  onClose,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div
        data-header
        className={`h-11 min-h-[44px] flex justify-between items-center px-4 rounded-t-xl sticky top-0 z-10 w-full flex-shrink-0 border-b border-[rgba(0,3,13,0.1)] bg-[rgba(0,3,13,0.05)]
          ${isMainTab ? "cursor-default" : "cursor-ns-resize"}`}
        onDoubleClick={isMainTab ? undefined : handleFullSize}>
        <div className="flex items-center overflow-hidden rounded-2xl">
          <div className="flex items-center px-2 rounded-full h-8 flex-shrink-0 bg-[rgba(0,3,13,0.05)] border border-[rgba(0,3,13,0.1)]">
            <p className="text-sm whitespace-nowrap">{type}</p>
          </div>
          <div className="ml-2 min-w-8 overflow-hidden">
            <p className="truncate text-[#00030D] font-semibold text-xl">{identifier}</p>
          </div>
        </div>
        <div className="flex items-center flex-shrink-0">
          {!isMainTab && (
            <IconButton onClick={handleFullSize} className="bg-transparent">
              {isFullSize ? <ChevronDown /> : <ChevronUp />}
            </IconButton>
          )}
          <IconButton className="bg-transparent">
            <ChevronUpRight />
          </IconButton>
          <IconButton onClick={onClose} className="bg-transparent ml-1 text-red-500 hover:text-red-700">
            <XCircle />
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export default TabContent;
