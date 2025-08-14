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
import { useCallback } from "react";
import TrashIcon from "../../../assets/icons/trash-2.svg";
import LinkIcon from "../../../assets/icons/link.svg";
import { IconButton } from "../..";
import { CONTEXT_CONSTANTS } from "@workspaceui/api-client/src/api/copilot";
import type { ContextPreviewProps } from "../types";

const ContextPreview: React.FC<ContextPreviewProps> = ({
  contextItems,
  onRemoveContext,
  showRemoveButton = true,
  translations,
}) => {
  const handleRemoveAll = useCallback(() => {
    for (const item of contextItems) {
      onRemoveContext(item.id);
    }
  }, [contextItems, onRemoveContext]);

  if (!contextItems || contextItems.length === 0) {
    return null;
  }
  if (contextItems.length > CONTEXT_CONSTANTS.MAX_ITEMS_DISPLAY) {
    return (
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2 bg-(--color-transparent-neutral-5) max-h-6 border border-(--color-transparent-neutral-10) rounded-full px-3 py-2 text-sm">
          <LinkIcon className="w-4 h-4 " fill="var-(--color-baseline-80)" />
          <span className="text-(--color-baseline-90) font-medium">
            {contextItems.length}
            {translations?.selectedRegisters}
          </span>
          {showRemoveButton && (
            <IconButton
              type="button"
              onClick={handleRemoveAll}
              className="[&>svg]:text-[1rem] hover:text-(--color-dynamic-main) hover:bg-blue-100 rounded-full w-4 h-4">
              <TrashIcon />
            </IconButton>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {contextItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 bg-(--color-transparent-neutral-5) max-h-6 border border-(--color-transparent-neutral-10) rounded-full px-3 py-2 text-sm">
          <LinkIcon className="w-4 h-4 " fill="var-(--color-baseline-80)" />
          <span className="text-(--color-baseline-90) font-medium">{item.label}</span>
          {showRemoveButton && (
            <IconButton
              type="button"
              onClick={() => onRemoveContext(item.id)}
              className="[&>svg]:text-[1rem] hover:text-(--color-dynamic-main) hover:bg-blue-100 rounded-full w-4 h-4">
              <TrashIcon />
            </IconButton>
          )}
        </div>
      ))}
    </div>
  );
};

export default ContextPreview;
