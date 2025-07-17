import type React from "react";
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
              onClick={() => {
                for (const item of contextItems) {
                  onRemoveContext(item.id);
                }
              }}
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
