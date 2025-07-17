import { useEffect, useRef } from "react";
import ContextPreview from "../ContextPreview";
import { MESSAGE_ROLES, CONTEXT_CONSTANTS } from "@workspaceui/api-client/src/api/copilot";
import type { MessageListProps } from "../types";

const MessageList: React.FC<MessageListProps> = ({ messages, labels, isLoading = false, translations }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const hasContextInMessage = (text: string) => {
    return text.startsWith(CONTEXT_CONSTANTS.TAG_START);
  };

  const getMessageWithoutContext = (text: string) => {
    const contextRegex = new RegExp(`^${CONTEXT_CONSTANTS.TAG_START}[\\s\\S]*?${CONTEXT_CONSTANTS.TAG_END}\\s*`);
    return text.replace(contextRegex, "").trim();
  };

  const getContextCountFromMessage = (text: string) => {
    const contextRegex = new RegExp(`${CONTEXT_CONSTANTS.TAG_START} \\((\\d+) registro[s]?\\):`);
    const match = text.match(contextRegex);
    return match ? Number.parseInt(match[1]) : 0;
  };

  if (messages.length === 0) {
    return (
      <div className="p-6 text-center">
        <h6 className="text-lg font-medium text-(--color-baseline-90)">
          {translations?.welcomeMessage || labels.ETCOP_Welcome_Message}
        </h6>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto flex flex-col gap-4">
      {messages.map((message, index) => {
        const messageHasContext = message.sender === MESSAGE_ROLES.USER && hasContextInMessage(message.text);
        const displayMessage = messageHasContext ? getMessageWithoutContext(message.text) : message.text;
        const contextCount = messageHasContext ? getContextCountFromMessage(message.text) : 0;

        return (
          <div key={index} className={`flex mb-2 ${message.sender === MESSAGE_ROLES.USER ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[70%] p-4 rounded-xl ${
                message.sender === MESSAGE_ROLES.USER
                  ? "bg-(--color-transparent-neutral-5) text-(--color-baseline-90) font-medium  rounded-tr-none"
                  : "bg-(--color-baseline-0) text-(--color-baseline-90) rounded-tl-none font-medium border-1 border-(--color-transparent-neutral-10) hover:border-(--color-baseline-100) transition-all duration-300"
              }`}>
              {messageHasContext && (
                <div className="mb-3">
                  <ContextPreview
                    contextItems={
                      contextCount > CONTEXT_CONSTANTS.MAX_ITEMS_DISPLAY
                        ? [{ id: "context-summary", label: `${contextCount}`, contextString: "" }]
                        : Array.from({ length: contextCount }, (_, i) => ({
                            id: `context-${i}`,
                            label: translations?.contextRecords || "",
                            contextString: "",
                          }))
                    }
                    onRemoveContext={() => {}}
                    showRemoveButton={false}
                    translations={{
                      selectedRegisters: translations?.contextRecords || "",
                    }}
                  />
                </div>
              )}
              <p className="text-sm mb-1">{displayMessage}</p>
              <span className="text-xs opacity-70">{message.timestamp}</span>
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="flex justify-start mb-2">
          <div className="flex items-center gap-2 p-4 rounded-lg bg-(--color-baseline-0)">
            <div className="spinner-gradient" />
            <span className="text-sm">{translations?.typing}</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
