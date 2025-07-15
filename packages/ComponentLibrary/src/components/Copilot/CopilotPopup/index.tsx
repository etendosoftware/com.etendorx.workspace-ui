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
  translations,
}) => {
  if (!open) return null;

  const handleHeaderClick = () => {
    onSelectAssistant(null);
    onResetConversation();
  };

  const getHeaderText = () => {
    if (selectedAssistant) {
      return `${translations.copilotProfile}: ${selectedAssistant.name}`;
    }
    return translations.copilotProfile;
  };

  const isHeaderClickable = selectedAssistant !== null && selectedAssistant !== undefined;

  return (
    <div className={`fixed z-500 ${isExpanded ? "inset-4" : "right-2 bottom-2"}`}>
      <div
        className={`bg-gradient-to-br from-purple-100 via-blue-50 to-green-50 rounded-lg border-2 border-gray-200 shadow-xl ${isExpanded ? "w-full h-full" : "w-[26.25rem] h-[600px] max-h-[90vh]"} flex flex-col`}>
        <div className="flex justify-between items-center p-4 pb-2 border-b border-gray-200">
          <div className="flex-1 pr-2 min-w-0">
            <button
              type="button"
              onClick={isHeaderClickable ? handleHeaderClick : undefined}
              className={`text-lg group font-semibold text-(--color-transparent-neutral-70) flex items-center gap-2 border-1 border-(--color-transparent-neutral-20) px-3 py-1 rounded-full min-w-0 max-w-76 ${
                isHeaderClickable
                  ? "cursor-pointer hover:text-(--color-dynamic-main) transition-colors"
                  : "cursor-default"
              }`}
              disabled={!isHeaderClickable}
              aria-label={isHeaderClickable ? translations.backToSelection : undefined}
              title={getHeaderText()}>
              <div className="flex-shrink-0">
                {isHeaderClickable && (
                  <BackIcon
                    fill="var(--color-transparent-neutral-70)"
                    className="group-hover:fill-(--color-dynamic-main) transition-colors"
                  />
                )}
                {!isHeaderClickable && <SparksIcon fill="var(--color-transparent-neutral-70)" />}
              </div>

              <span className="truncate min-w-0 text-left">{getHeaderText()}</span>
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
            translations={{
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
