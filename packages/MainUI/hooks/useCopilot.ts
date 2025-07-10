import { useState, useCallback, useRef, useMemo } from "react";
import { useSSEConnection } from "./useSSEConnection";
import { type IMessage, MESSAGE_ROLES, type IAssistant, CopilotClient } from "@workspaceui/api-client/src/api/copilot";
import { formatTimeNewDate } from "@/utils";

export const useCopilot = () => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isBotLoading, setIsBotLoading] = useState<boolean>(false);
  const [files, setFiles] = useState<File[] | null>(null);
  const [fileIds, setFileIds] = useState<string[] | null>(null);

  const [contextValue, setContextValue] = useState(null);
  const [contextTitle, setContextTitle] = useState<string | null>(null);

  const messagesEndRef = useRef<any>(null);

  const { startSSEConnection, closeConnection } = useSSEConnection({
    onMessage: handleSSEMessage,
    onError: handleSSEError,
    onComplete: () => setIsBotLoading(false),
  });

  const urlParams = useMemo(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  }, []);

  function handleSSEMessage(data: any) {
    const answer = data?.answer;
    if (answer?.conversation_id) {
      setConversationId(answer.conversation_id);
    }
    if (answer?.response) {
      if (answer.role === "debug") {
        console.log("Debug message", answer.response);
      } else {
        handleNewMessage(answer.role || MESSAGE_ROLES.BOT, answer);
      }
    }
  }

  function handleSSEError(error: string) {
    setIsBotLoading(false);
    showErrorMessage(error);
  }

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleNewMessage = useCallback(
    async (role: string, message: IMessage) => {
      const currentContextTitle = contextTitle;
      let text = message.response ?? message.text;

      if (role === MESSAGE_ROLES.WAIT) {
        text = `⏳ ${text}`;
      }
      if (role === MESSAGE_ROLES.TOOL) {
        text = `🛠️ ${text}`;
      }
      if (role === MESSAGE_ROLES.NODE) {
        text = `🤖 ${text}`;
      }

      setMessages((prevMessages) => {
        const newMessage: IMessage = {
          message_id: message.message_id,
          text,
          sender: role,
          timestamp: formatTimeNewDate(new Date()),
          files: files ? files.map((file) => ({ name: file.name })) : undefined,
          context: currentContextTitle || undefined,
        };

        const lastMessage = prevMessages[prevMessages.length - 1];
        if (
          lastMessage &&
          (lastMessage.sender === MESSAGE_ROLES.TOOL ||
            lastMessage.sender === MESSAGE_ROLES.NODE ||
            lastMessage.sender === MESSAGE_ROLES.WAIT) &&
          (role === lastMessage.sender || role === MESSAGE_ROLES.BOT || lastMessage.sender === MESSAGE_ROLES.WAIT)
        ) {
          return [...prevMessages.slice(0, -1), newMessage];
        }
        return [...prevMessages, newMessage];
      });

      if (role === MESSAGE_ROLES.USER && currentContextTitle) {
        setContextTitle(null);
        setContextValue(null);
      }

      if (role === MESSAGE_ROLES.USER) {
        await handleNewMessage(MESSAGE_ROLES.WAIT, {
          text: "Processing...",
          sender: MESSAGE_ROLES.WAIT,
          timestamp: formatTimeNewDate(new Date()),
        });
      }

      scrollToBottom();
    },
    [contextTitle, files, scrollToBottom]
  );

  const showErrorMessage = useCallback(
    async (errorMessage: string) => {
      await handleNewMessage(MESSAGE_ROLES.BOT, {
        text: errorMessage,
        sender: MESSAGE_ROLES.ERROR,
        timestamp: formatTimeNewDate(new Date()),
      });
      scrollToBottom();
    },
    [handleNewMessage, scrollToBottom]
  );

  const handleSendMessage = useCallback(
    async (selectedAssistant: IAssistant | null) => {
      if (isBotLoading || !inputValue.trim()) return;

      setIsBotLoading(true);
      setFiles(null);
      setFileIds(null);

      const originalQuestion = inputValue.trim();
      setInputValue("");

      let finalQuestion = originalQuestion;
      if (contextValue) {
        const contextValueString = JSON.stringify(contextValue, null, 2);
        finalQuestion = `<Context>${contextValueString}</Context>\n<Question>${originalQuestion}</Question>`;
      }

      const userMessage: IMessage = {
        text: originalQuestion,
        sender: MESSAGE_ROLES.USER,
        timestamp: formatTimeNewDate(new Date()),
      };

      await handleNewMessage(MESSAGE_ROLES.USER, userMessage);

      const requestParams: any = {
        question: finalQuestion,
        app_id: selectedAssistant?.app_id,
      };

      if (conversationId) {
        requestParams.conversation_id = conversationId;
      }

      if (fileIds) {
        requestParams.file = fileIds;
      }

      if (encodeURIComponent(finalQuestion).length > 7000) {
        try {
          await CopilotClient.cacheQuestion(finalQuestion);
          requestParams.question = undefined;
        } catch (error) {
          console.error("Error caching question:", error);
        }
      }

      startSSEConnection(requestParams);
    },
    [isBotLoading, inputValue, contextValue, conversationId, fileIds, handleNewMessage, startSSEConnection]
  );

  const handleFileUpload = useCallback(
    async (uploadedFiles: File[]) => {
      try {
        const uploadPromises = uploadedFiles.map((file) => CopilotClient.uploadFile(file));
        const uploadResults = await Promise.all(uploadPromises);
        const ids = uploadResults.flatMap((result) => Object.values(result));
        setFileIds(ids as string[]);
        setFiles(uploadedFiles);
      } catch (error) {
        console.error("Error uploading files:", error);
        showErrorMessage("Error uploading files");
      }
    },
    [showErrorMessage]
  );

  const resetConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    closeConnection();
  }, [closeConnection]);

  return {
    messages,
    inputValue,
    isBotLoading,
    files,
    contextTitle,
    messagesEndRef,

    setInputValue,
    setContextTitle,
    setContextValue,

    handleSendMessage,
    handleFileUpload,
    resetConversation,
    scrollToBottom,
  };
};
