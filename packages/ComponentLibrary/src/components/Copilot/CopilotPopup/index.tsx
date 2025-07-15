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
}) => {
  if (!open) return null;

  const handleHeaderClick = () => {
    onSelectAssistant(null);
    onResetConversation();
  };

  const getHeaderText = () => {
    if (selectedAssistant) {
      return `Perfil Copilot: ${selectedAssistant.name}`;
    }
    return "Perfil Copilot";
  };

  const isHeaderClickable = !!selectedAssistant;

  return (
    <div className={`fixed z-500 ${isExpanded ? "inset-4" : "right-2 bottom-2"}`}>
      <div
        className={`bg-gradient-to-br from-purple-100 via-blue-50 to-green-50 rounded-lg border-2 border-gray-200 shadow-xl ${isExpanded ? "w-full h-full" : "w-[26.25rem] h-[600px] max-h-[90vh]"} flex flex-col`}>
        <div className="flex justify-between items-center p-4 pb-2 border-b border-gray-200">
          <button
            type="button"
            onClick={isHeaderClickable ? handleHeaderClick : undefined}
            className={`text-lg group font-semibold text-(--color-transparent-neutral-70) flex items-center gap-2 border-1 border-(--color-transparent-neutral-20) px-3 py-1 rounded-full  ${
              isHeaderClickable ? "cursor-pointer hover:text-blue-600 transition-colors" : "cursor-default"
            }`}
            disabled={!isHeaderClickable}
            aria-label={isHeaderClickable ? "Volver a selección de asistentes" : undefined}>
            {isHeaderClickable && (
              <BackIcon
                fill="var(--color-transparent-neutral-70)"
                className="group-hover:fill-blue-600 transition-colors"
              />
            )}
            {!isHeaderClickable && <SparksIcon fill="var(--color-transparent-neutral-70)" />}
            {getHeaderText()}
          </button>
          <div className="flex gap-1">
            {onToggleExpanded && (
              <IconButton
                onClick={onToggleExpanded}
                aria-label={isExpanded ? "Minimizar" : "Maximizar"}
                className="[&>svg]:text-[1.25rem]">
                {isExpanded ? <MinimizeIcon /> : <MaximizeIcon />}
              </IconButton>
            )}
            <IconButton onClick={onClose} aria-label="Cerrar" className="[&>svg]:text-[1.25rem]">
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
          />
        </div>
      </div>
    </div>
  );
};

export default CopilotPopup;
