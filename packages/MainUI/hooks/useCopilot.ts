import { useCallback, useMemo, useReducer } from "react";
import { useSSEConnection } from "./useSSEConnection";
import type { IMessage, IAssistant, CopilotQuestionParams } from "@workspaceui/api-client/src/api/copilot";
import { formatTimeNewDate, getMessageType } from "@/utils";
import { useCopilotClient } from "./useCopilotClient";

interface CopilotState {
  messages: IMessage[];
  selectedAssistant: IAssistant | null;
  conversationId: string | null;
  isLoading: boolean;
  files: File[] | null;
  fileIds: string[] | null;
  contextValue: Record<string, unknown> | null;
  contextTitle: string | null;
}

type CopilotAction =
  | { type: "SET_MESSAGES"; messages: IMessage[] }
  | { type: "ADD_MESSAGE"; message: IMessage }
  | { type: "SET_SELECTED_ASSISTANT"; assistant: IAssistant | null }
  | { type: "SET_CONVERSATION_ID"; conversationId: string | null }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "SET_FILES"; files: File[] | null }
  | { type: "SET_FILE_IDS"; fileIds: string[] | null }
  | { type: "SET_CONTEXT_VALUE"; contextValue: Record<string, unknown> | null }
  | { type: "SET_CONTEXT_TITLE"; contextTitle: string | null }
  | { type: "RESET_CONVERSATION" };

const initialState: CopilotState = {
  messages: [],
  selectedAssistant: null,
  conversationId: null,
  isLoading: false,
  files: null,
  fileIds: null,
  contextValue: null,
  contextTitle: null,
};

function copilotReducer(state: CopilotState, action: CopilotAction): CopilotState {
  switch (action.type) {
    case "SET_MESSAGES":
      return { ...state, messages: action.messages };
    case "ADD_MESSAGE": {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage && lastMessage.text === action.message.text && lastMessage.sender === action.message.sender) {
        return state;
      }
      return { ...state, messages: [...state.messages, action.message] };
    }
    case "SET_SELECTED_ASSISTANT":
      return { ...state, selectedAssistant: action.assistant };
    case "SET_CONVERSATION_ID":
      return { ...state, conversationId: action.conversationId };
    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };
    case "SET_FILES":
      return { ...state, files: action.files };
    case "SET_FILE_IDS":
      return { ...state, fileIds: action.fileIds };
    case "SET_CONTEXT_VALUE":
      return { ...state, contextValue: action.contextValue };
    case "SET_CONTEXT_TITLE":
      return { ...state, contextTitle: action.contextTitle };
    case "RESET_CONVERSATION":
      return {
        ...initialState,
        selectedAssistant: null,
      };
    default:
      return state;
  }
}

export const useCopilot = () => {
  const [state, dispatch] = useReducer(copilotReducer, initialState);
  const copilotClient = useCopilotClient();

  const addMessage = useCallback((sender: string, text: string) => {
    const newMessage: IMessage = {
      text,
      sender,
      timestamp: formatTimeNewDate(new Date()),
    };

    dispatch({ type: "ADD_MESSAGE", message: newMessage });
  }, []);

  const handleSSEMessage = useCallback((data: Record<string, unknown>) => {
    const answer = data?.answer as { conversation_id?: string; response?: string; role?: string };
    if (answer?.conversation_id) {
      dispatch({ type: "SET_CONVERSATION_ID", conversationId: answer.conversation_id });
    }

    if (answer?.response) {
      if (answer.role !== "debug") {
        addMessage("bot", answer.response);
      }
    }
  }, [addMessage]);

  const handleSSEError = useCallback((error: string) => {
    console.error("SSE Error:", error);
    
    // Only stop loading if it's a final connection error (not a retry)
    if (error.includes("Connection error occurred")) {
      dispatch({ type: "SET_LOADING", isLoading: false });
      addMessage("error", `Error: ${error}`);
    }
  }, [addMessage]);

  const handleSSEComplete = useCallback(() => {
    dispatch({ type: "SET_LOADING", isLoading: false });
  }, []);

  const { startSSEConnection, closeConnection } = useSSEConnection({
    onMessage: handleSSEMessage,
    onError: handleSSEError,
    onComplete: handleSSEComplete,
  });

  const finalQuestion = useMemo(() => {
    if (!state.contextValue) return null;
    return (message: string) => {
      const contextValueString = JSON.stringify(state.contextValue, null, 2);
      return `<Context>${contextValueString}</Context>\n<Question>${message}</Question>`;
    };
  }, [state.contextValue]);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (state.isLoading || !message.trim() || !state.selectedAssistant) {
        return;
      }

      dispatch({ type: "SET_LOADING", isLoading: true });
      addMessage("user", message);

      const questionText = finalQuestion ? finalQuestion(message) : message;

      const requestParams: Record<string, unknown> = {
        question: questionText,
        app_id: state.selectedAssistant.app_id,
      };

      if (state.conversationId) {
        requestParams.conversation_id = state.conversationId;
      }

      if (state.fileIds) {
        requestParams.file = state.fileIds;
      }

      try {
        const processedParams = await copilotClient.handleLargeQuestion(requestParams as CopilotQuestionParams);
        await startSSEConnection(processedParams);
      } catch (error) {
        console.error("Error sending message:", error);
        dispatch({ type: "SET_LOADING", isLoading: false });
        addMessage("error", "Error enviando mensaje");
      }
    },
    [
      state.isLoading,
      state.selectedAssistant,
      state.conversationId,
      state.fileIds,
      finalQuestion,
      addMessage,
      startSSEConnection,
      copilotClient,
    ]
  );

  const handleSelectAssistant = useCallback(
    (assistant: IAssistant) => {
      dispatch({ type: "SET_SELECTED_ASSISTANT", assistant });
      dispatch({ type: "SET_MESSAGES", messages: [] });
      dispatch({ type: "SET_CONVERSATION_ID", conversationId: null });
      closeConnection();
    },
    [closeConnection]
  );

  const handleResetConversation = useCallback(() => {
    dispatch({ type: "RESET_CONVERSATION" });
    closeConnection();
  }, [closeConnection]);

  const handleFileUpload = useCallback(
    async (uploadedFiles: File[]) => {
      try {
        const uploadResults = await Promise.all(uploadedFiles.map((file) => copilotClient.uploadFile(file)));
        const ids = uploadResults.flatMap((result) => Object.values(result));
        dispatch({ type: "SET_FILE_IDS", fileIds: ids as string[] });
        dispatch({ type: "SET_FILES", files: uploadedFiles });
      } catch (error) {
        console.error("Error uploading files:", error);
        addMessage("error", "Error subiendo archivos");
      }
    },
    [addMessage, copilotClient]
  );

  const getMessageDisplayType = useCallback((sender: string) => {
    return getMessageType(sender);
  }, []);

  const setContextTitle = useCallback((title: string | null) => {
    dispatch({ type: "SET_CONTEXT_TITLE", contextTitle: title });
  }, []);

  const setContextValue = useCallback((value: Record<string, unknown> | null) => {
    dispatch({ type: "SET_CONTEXT_VALUE", contextValue: value });
  }, []);

  return {
    messages: state.messages,
    selectedAssistant: state.selectedAssistant,
    isLoading: state.isLoading,
    files: state.files,
    contextTitle: state.contextTitle,

    setContextTitle,
    setContextValue,

    handleSendMessage,
    handleSelectAssistant,
    handleResetConversation,
    handleFileUpload,
    getMessageDisplayType,
  };
};
