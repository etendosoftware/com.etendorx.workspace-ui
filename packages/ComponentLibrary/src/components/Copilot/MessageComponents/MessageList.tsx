import type React from "react";
import { useEffect, useRef } from "react";
import type { IMessage, ILabels } from "@workspaceui/api-client/src/api/copilot";

interface MessageListProps {
  messages: IMessage[];
  labels: ILabels;
  isExpanded?: boolean;
  isLoading?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, labels, isLoading = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="p-6 text-center">
        <h6 className="text-lg font-medium text-gray-600">
          {labels.ETCOP_Welcome_Message || "¡Hola! ¿En qué puedo ayudarte hoy?"}
        </h6>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto flex flex-col gap-4">
      {messages.map((message, index) => (
        <div key={index} className={`flex mb-2 ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[70%] p-4 rounded-lg ${
              message.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
            }`}>
            <p className="text-sm mb-1">{message.text}</p>
            <span className="text-xs opacity-70">{message.timestamp}</span>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start mb-2">
          <div className="flex items-center gap-2 p-4 rounded-lg bg-gray-100">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
            <span className="text-sm">Escribiendo...</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
