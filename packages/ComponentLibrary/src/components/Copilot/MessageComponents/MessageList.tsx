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

import { useEffect, useRef, useMemo, useCallback } from "react";
import ContextPreview from "../ContextPreview";
import { MESSAGE_ROLES, CONTEXT_CONSTANTS } from "@workspaceui/api-client/src/api/copilot";
import type { MessageListProps } from "../types";
import MarkdownMessage from "./MarkdownMessage";

const MessageList: React.FC<MessageListProps> = ({ messages, labels, isLoading = false, translations }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter out tool messages that have been followed by another message
  const filteredMessages = useMemo(() => {
    const result = [];
    for (let i = 0; i < messages.length; i++) {
      const currentMessage = messages[i];
      const nextMessage = messages[i + 1];

      // Skip tool messages if there's a next message (meaning the tool execution finished)
      if (currentMessage.role === "tool" && nextMessage) {
        continue;
      }

      result.push(currentMessage);
    }
    return result;
  }, [messages]);

  // Check if the last message is a tool message (showing a loading state)
  const hasActiveToolMessage = useMemo(() => {
    const lastMessage = messages[messages.length - 1];
    return lastMessage?.role === "tool";
  }, [messages]);

  const hasContextInMessage = useCallback((text: string) => {
    return text.startsWith(CONTEXT_CONSTANTS.TAG_START);
  }, []);

  const contextRegex = useMemo(() => {
    return new RegExp(`^${CONTEXT_CONSTANTS.TAG_START}[\\s\\S]*?${CONTEXT_CONSTANTS.TAG_END}\\s*`);
  }, []);

  const contextCountRegex = useMemo(() => {
    return new RegExp(`${CONTEXT_CONSTANTS.TAG_START} \\((\\d+) ${translations?.contextRecords || ""}`);
  }, [translations?.contextRecords]);

  const getMessageWithoutContext = useCallback(
    (text: string) => {
      return text.replace(contextRegex, "").trim();
    },
    [contextRegex]
  );

  const getContextCountFromMessage = useCallback(
    (text: string) => {
      const match = text.match(contextCountRegex);
      return match ? Number.parseInt(match[1]) : 0;
    },
    [contextCountRegex]
  );

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
      {filteredMessages.map((message, index) => {
        const messageHasContext = message.sender === MESSAGE_ROLES.USER && hasContextInMessage(message.text);
        const displayMessage = messageHasContext ? getMessageWithoutContext(message.text) : message.text;
        const contextCount = messageHasContext ? getContextCountFromMessage(message.text) : 0;

        return (
          <div
            key={message.message_id || `${message.sender}-${message.timestamp}-${index}`}
            className={`flex mb-2 ${message.sender === MESSAGE_ROLES.USER ? "justify-end" : "justify-start"}`}>
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
              <div className="mb-1">
                <MarkdownMessage content={displayMessage} />
              </div>
              <span className="text-xs opacity-70">{message.timestamp}</span>
            </div>
          </div>
        );
      })}

      {(isLoading || hasActiveToolMessage) && (
        <div className="flex justify-start mb-2">
          <div className="flex items-center gap-2 p-4 rounded-lg bg-(--color-baseline-0)">
            <div className="spinner-gradient" />
            <span className="text-sm">
              {hasActiveToolMessage && messages[messages.length - 1]?.text
                ? messages[messages.length - 1].text
                : translations?.typing}
            </span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
