import { useEffect, useRef } from "react";
import type { MessageListProps } from "../types";

const MessageList: React.FC<MessageListProps> = ({ messages, labels, isLoading = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="p-6 text-center">
        <h6 className="text-lg font-medium text-(--color-baseline-90)">
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
            className={`max-w-[70%] p-4 rounded-xl ${
              message.sender === "user"
                ? "bg-(--color-transparent-neutral-5) text-(--color-baseline-90) font-medium  rounded-tr-none"
                : "bg-(--color-baseline-0) text-(--color-baseline-90) rounded-tl-none font-medium border-1 border-(--color-transparent-neutral-10) hover:border-(--color-baseline-100) transition-all duration-300"
            }`}>
            <p className="text-sm mb-1">{message.text}</p>
            <span className="text-xs opacity-70">{message.timestamp}</span>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start mb-2">
          <div className="flex items-center gap-2 p-4 rounded-lg bg-(--color-baseline-0)">
            <div className="spinner-gradient" />
            <span className="text-sm">Escribiendo...</span>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
