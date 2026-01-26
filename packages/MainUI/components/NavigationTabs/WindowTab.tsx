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

import CloseIcon from "@workspaceui/componentlibrary/src/assets/icons/x.svg";
import FolderIcon from "@workspaceui/componentlibrary/src/assets/icons/folder.svg";
import { useTranslation } from "@/hooks/useTranslation";
import Tooltip from "@workspaceui/componentlibrary/src/components/Tooltip";

interface WindowTabProps {
  title: string;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
  icon?: React.ReactNode;
}

export default function WindowTab({ title, isActive, onActivate, onClose }: WindowTabProps) {
  const { t } = useTranslation();

  return (
    <Tooltip title={title} data-testid="Tooltip__15c554">
      <div
        className={`
         h-9 flex gap-2 items-center justify-center p-2 cursor-pointer max-w-[220px] 
         relative group transition-all duration-200 text-(--color-baseline-90) 
         ${
           isActive
             ? "bg-(--color-baseline-0) border-b-2 border-(--color-dynamic-main)"
             : "hover:bg-(--color-baseline-0)"
         }
       `}
        style={{
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
        }}>
        <button
          type="button"
          className="h-full flex items-center flex-1 truncate gap-2 bg-transparent border-none cursor-pointer"
          onClick={onActivate}>
          <FolderIcon className="fill-black" data-testid="FolderIcon__15c554" />
          <span className="flex-1 truncate text-sm font-medium">{title}</span>
        </button>
        <button
          type="button"
          className={`
           w-5 h-5 flex-shrink-0 rounded-full transition-opacity duration-200
           hover:bg-gray-300 hover:text-gray-800 flex items-center justify-center
         `}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title={t("primaryTabs.closeWindow")}>
          <CloseIcon data-testid="CloseIcon__15c554" />
        </button>
      </div>
    </Tooltip>
  );
}
