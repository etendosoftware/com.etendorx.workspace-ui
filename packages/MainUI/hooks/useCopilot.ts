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

import { useCallback, useMemo, useReducer } from "react";
import { useSSEConnection } from "./useSSEConnection";
import type {
  IMessage,
  IAssistant,
  CopilotQuestionParams,
  IConversationSummary,
} from "@workspaceui/api-client/src/api/copilot";
import { formatTime, getMessageType } from "@/utils";
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
  conversations: IConversationSummary[];
  conversationsLoading: boolean;
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
  | { type: "SET_CONVERSATIONS"; conversations: IConversationSummary[] }
  | { type: "SET_CONVERSATIONS_LOADING"; loading: boolean }
  | { type: "UPDATE_CONVERSATION_TITLE"; conversationId: string; title: string }
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
  conversations: [],
  conversationsLoading: false,
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
    case "SET_CONVERSATIONS":
      return { ...state, conversations: action.conversations };
    case "SET_CONVERSATIONS_LOADING":
      return { ...state, conversationsLoading: action.loading };
    case "UPDATE_CONVERSATION_TITLE":
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === action.conversationId ? { ...conv, title: action.title } : conv
        ),
      };
    case "RESET_CONVERSATION":
      return {
        ...initialState,
        selectedAssistant: state.selectedAssistant,
        conversations: state.conversations,
        conversationsLoading: state.conversationsLoading,
      };
    default:
      return state;
  }
}

export const useCopilot = () => {
  const [state, dispatch] = useReducer(copilotReducer, initialState);
  const copilotClient = useCopilotClient();

  const addMessage = useCallback((sender: string, text: string, role?: string, files?: File[]) => {
    const newMessage: IMessage = {
      text,
      sender,
      timestamp: formatTime(new Date()),
      role,
      files: files?.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    };

    dispatch({ type: "ADD_MESSAGE", message: newMessage });
  }, []);

  const handleSSEMessage = useCallback(
    (data: Record<string, unknown>) => {
      const answer = data?.answer as { conversation_id?: string; response?: string; role?: string };
      if (answer?.conversation_id) {
        dispatch({ type: "SET_CONVERSATION_ID", conversationId: answer.conversation_id });
      }

      if (answer?.response) {
        if (answer.role !== "debug") {
          addMessage("bot", answer.response, answer.role);
        }
      }
    },
    [addMessage]
  );

  const handleSSEError = useCallback(
    (error: string) => {
      console.error("SSE Error:", error);

      if (error.includes("Connection error occurred")) {
        dispatch({ type: "SET_LOADING", isLoading: false });
        addMessage("error", `Error: ${error}`);
      }
    },
    [addMessage]
  );

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
      // Add message with attached files
      addMessage("user", message, undefined, state.files || undefined);

      const questionText = finalQuestion ? finalQuestion(message) : message;

      const requestParams: Record<string, unknown> = {
        question: questionText,
        app_id: state.selectedAssistant.app_id,
      };

      if (state.conversationId) {
        requestParams.conversation_id = state.conversationId;
      }

      if (state.fileIds && state.fileIds.length > 0) {
        requestParams.file = state.fileIds;
      }

      try {
        const processedParams = await copilotClient.handleLargeQuestion(requestParams as CopilotQuestionParams);
        await startSSEConnection(processedParams);

        // Clear files after successful send
        dispatch({ type: "SET_FILES", files: null });
        dispatch({ type: "SET_FILE_IDS", fileIds: null });
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
      state.files,
      finalQuestion,
      addMessage,
      startSSEConnection,
      copilotClient,
    ]
  );

  const handleSelectAssistant = useCallback(
    (assistant: IAssistant | null) => {
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

        // Append to existing files and file IDs
        const newFiles = [...(state.files || []), ...uploadedFiles];
        const newFileIds = [...(state.fileIds || []), ...(ids as string[])];

        dispatch({ type: "SET_FILE_IDS", fileIds: newFileIds });
        dispatch({ type: "SET_FILES", files: newFiles });
      } catch (error) {
        console.error("Error uploading files:", error);
        addMessage("error", "Error subiendo archivos");
      }
    },
    [addMessage, copilotClient, state.files, state.fileIds]
  );

  const handleRemoveFile = useCallback(
    (index: number) => {
      const newFiles = state.files?.filter((_, i) => i !== index) || null;
      const newFileIds = state.fileIds?.filter((_, i) => i !== index) || null;

      dispatch({ type: "SET_FILES", files: newFiles });
      dispatch({ type: "SET_FILE_IDS", fileIds: newFileIds });
    },
    [state.files, state.fileIds]
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

  const generateTitleForConversation = useCallback(
    async (conversationId: string) => {
      try {
        const generatedTitle = await copilotClient.generateTitle(conversationId);
        // Update the specific conversation with the generated title
        dispatch({
          type: "UPDATE_CONVERSATION_TITLE",
          conversationId,
          title: generatedTitle,
        });
      } catch (err) {
        console.error("❌ Error generating title for", conversationId, err);
        // Set fallback title on error
        dispatch({
          type: "UPDATE_CONVERSATION_TITLE",
          conversationId,
          title: "Untitled Conversation",
        });
      }
    },
    [copilotClient]
  );

  const loadConversations = useCallback(async () => {
    if (!state.selectedAssistant) return;

    dispatch({ type: "SET_CONVERSATIONS_LOADING", loading: true });
    try {
      const conversations = await copilotClient.getConversations(state.selectedAssistant.app_id);
      dispatch({ type: "SET_CONVERSATIONS", conversations });

      // Find conversations without titles and generate them
      const conversationsWithoutTitle = conversations.filter(
        (conv) =>
          !conv.title ||
          conv.title.trim() === "" ||
          conv.title === "Current conversation" ||
          conv.title === "Conversación actual"
      );

      if (conversationsWithoutTitle.length > 0) {
        // Process in batches to avoid flooding the backend
        const batchSize = 3;
        const batchDelayMs = 2000;

        for (let i = 0; i < conversationsWithoutTitle.length; i += batchSize) {
          const batch = conversationsWithoutTitle.slice(i, i + batchSize);

          // Update UI to show 'Generating...' for batch items
          const batchIds = new Set(batch.map((b) => b.id));
          dispatch({
            type: "SET_CONVERSATIONS",
            conversations: conversations.map((conv) =>
              batchIds.has(conv.id) ? { ...conv, title: "Generating..." } : conv
            ),
          });

          // Generate titles in background for this batch (fire and forget)
          for (const conversation of batch) {
            generateTitleForConversation(conversation.id);
          }

          // Wait before starting the next batch
          if (i + batchSize < conversationsWithoutTitle.length) {
            await new Promise((resolve) => setTimeout(resolve, batchDelayMs));
          }
        }
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      dispatch({ type: "SET_CONVERSATIONS", conversations: [] });
    } finally {
      dispatch({ type: "SET_CONVERSATIONS_LOADING", loading: false });
    }
  }, [state.selectedAssistant, copilotClient, generateTitleForConversation]);

  const handleSelectConversation = useCallback(
    async (conversationId: string) => {
      dispatch({ type: "SET_LOADING", isLoading: true });
      try {
        const conversationDetail = await copilotClient.getConversationMessages(conversationId);
        dispatch({ type: "SET_CONVERSATION_ID", conversationId });
        dispatch({ type: "SET_MESSAGES", messages: conversationDetail.messages || [] });
      } catch (error) {
        console.error("Error loading conversation messages:", error);
        addMessage("error", "Error loading conversation");
      } finally {
        dispatch({ type: "SET_LOADING", isLoading: false });
      }
    },
    [copilotClient, addMessage]
  );

  return {
    messages: state.messages,
    selectedAssistant: state.selectedAssistant,
    isLoading: state.isLoading,
    files: state.files,
    contextTitle: state.contextTitle,
    conversations: state.conversations,
    conversationsLoading: state.conversationsLoading,

    setContextTitle,
    setContextValue,

    handleSendMessage,
    handleSelectAssistant,
    handleResetConversation,
    handleFileUpload,
    handleRemoveFile,
    getMessageDisplayType,
    loadConversations,
    handleSelectConversation,
  };
};
