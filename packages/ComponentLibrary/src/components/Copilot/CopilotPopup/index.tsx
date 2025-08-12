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

import type {} from "@workspaceui/api-client/src/api/copilot";
import ChatInterface from "./ChatInterface";
import IconButton from "../../IconButton";
import XIcon from "../../../assets/icons/x.svg";
import MaximizeIcon from "../../../assets/icons/maximize-2.svg";
import MinimizeIcon from "../../../assets/icons/minimize-2.svg";
import BackIcon from "../../../assets/icons/arrow-left.svg";
import SparksIcon from "../../../assets/icons/sparks.svg";
import type { CopilotPopupProps } from "../types";

const CopilotPopup: React.FC<CopilotPopupProps> = ({
  open,
  onClose,
  assistants,
  labels,
  isExpanded = false,
  onToggleExpanded,
  messages,
  selectedAssistant,
  isLoading,
  onSelectAssistant,
  onSendMessage,
  onResetConversation,
  showDescription,
  hasContextPending = false,
  contextItems = [],
  onRemoveContext,
  translations,
}) => {
  if (!open) return null;

  const handleHeaderClick = () => {
    onSelectAssistant(null);
    onResetConversation();
  };

  const truncateAssistantName = (name: string, maxLength = 20) => {
    if (name.length <= maxLength) return name;
    return `${name.substring(0, maxLength)}...`;
  };

  const getHeaderText = () => {
    if (selectedAssistant) {
      const assistantName = isExpanded ? selectedAssistant.name : truncateAssistantName(selectedAssistant.name);
      return `${translations.copilotProfile}: ${assistantName}`;
    }
    return translations.copilotProfile;
  };

  const isHeaderClickable = selectedAssistant !== null && selectedAssistant !== undefined;

  return (
    <div className={`fixed z-500 ${isExpanded ? "inset-4" : "right-2 bottom-2"}`}>
      <div
        className={`bg-gradient-to-br from-purple-100 via-blue-50 to-green-50 rounded-lg border-1  border-(--color-transparent-neutral-20) shadow-xl ${isExpanded ? "w-full h-full" : "w-[26.25rem] h-[600px] max-h-[90vh]"} flex flex-col`}>
        <div className="flex justify-between items-center p-4 pb-2 border-b border-(--color-transparent-neutral-20)">
          <div className="flex-1 pr-2 min-w-0">
            <button
              type="button"
              onClick={isHeaderClickable ? handleHeaderClick : undefined}
              className={`text-lg group font-semibold text-(--color-transparent-neutral-70) flex items-center gap-2 border-1 border-(--color-transparent-neutral-20) px-3 py-1 rounded-full min-w-0 ${
                isExpanded ? "max-w-none" : "max-w-76"
              } 
              ${
                isHeaderClickable
                  ? "cursor-pointer hover:text-(--color-dynamic-main) transition-colors"
                  : "cursor-default"
              }`}
              disabled={!isHeaderClickable}
              aria-label={isHeaderClickable ? translations.backToSelection : undefined}
              title={getHeaderText()}>
              <div className="flex-shrink-0">
                {isHeaderClickable ? (
                  <BackIcon
                    fill="var(--color-transparent-neutral-70)"
                    className="group-hover:fill-(--color-dynamic-main) transition-colors"
                  />
                ) : (
                  <SparksIcon
                    fill={hasContextPending ? "var(--color-dynamic-main)" : "var(--color-transparent-neutral-70)"}
                  />
                )}
              </div>
              <p className="truncate min-w-0 text-left">
                {getHeaderText()}
                {hasContextPending && !isHeaderClickable ? (
                  <span className="bg-blue-100 text-(--color-dynamic-main) py-1 px-2 rounded-full ml-2">
                    {translations.contextText}
                  </span>
                ) : (
                  ""
                )}
              </p>
            </button>
          </div>

          <div className="flex gap-1 flex-shrink-0">
            {onToggleExpanded && (
              <IconButton
                onClick={onToggleExpanded}
                aria-label={isExpanded ? translations.minimize : translations.maximize}
                className="[&>svg]:text-[1.25rem]">
                {isExpanded ? <MinimizeIcon /> : <MaximizeIcon />}
              </IconButton>
            )}
            <IconButton onClick={onClose} aria-label={translations.close} className="[&>svg]:text-[1.25rem]">
              <XIcon />
            </IconButton>
          </div>
        </div>

        <div className="p-0 flex flex-col flex-1 overflow-hidden">
          <ChatInterface
            assistants={assistants}
            labels={labels}
            isExpanded={isExpanded}
            messages={messages}
            selectedAssistant={selectedAssistant}
            isLoading={isLoading}
            onSelectAssistant={onSelectAssistant}
            onSendMessage={onSendMessage}
            onResetConversation={onResetConversation}
            showDescription={showDescription}
            contextItems={contextItems}
            onRemoveContext={onRemoveContext}
            translations={{
              selectedRegisters: translations.selectedRegisters,
              assistantSelector: translations.assistantSelector,
              messageInput: translations.messageInput,
              messageList: translations.messageList,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CopilotPopup;
