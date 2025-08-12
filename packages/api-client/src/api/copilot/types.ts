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

import type { MESSAGE_ROLES } from "./constants";

/**
 * Assistant configuration
 */
export interface IAssistant {
  app_id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Message structure for copilot interactions
 */
export interface IMessage {
  message_id?: string;
  text: string;
  response?: string;
  sender: string;
  timestamp: string;
  file?: string;
  files?: IMessageFile[];
  context?: string;
  role?: string;
  isLoading?: boolean;
  error?: string;
}

/**
 * File information in messages
 */
export interface IMessageFile {
  name: string;
  size?: number;
  type?: string;
  uploadId?: string;
}

/**
 * Localization labels
 */
export interface ILabels {
  [key: string]: string;
}

/**
 * Parameters for copilot questions
 */
export interface CopilotQuestionParams extends Record<string, unknown> {
  question: string;
  app_id?: string;
  conversation_id?: string;
  file?: string[];
  context?: string;
  metadata?: Record<string, unknown>;
}

/**
 * File upload configuration
 */
export interface CopilotUploadConfig {
  file: (string | File)[] | null;
  url: string;
  method: string;
  headers?: Record<string, string>;
  onProgress?: (progress: number) => void;
  onSuccess?: (response: Record<string, unknown>) => void;
  onError?: (error: Error | Record<string, unknown>) => void;
}

/**
 * Response from copilot API
 */
export interface CopilotResponse {
  answer?: {
    response?: string;
    conversation_id?: string;
    role?: string;
    error?: string;
    metadata?: Record<string, unknown>;
  };
  error?: string;
  success?: boolean;
  data?: Record<string, unknown>;
}

/**
 * SSE Event data structure
 */
export interface SSEEventData {
  answer?: {
    response?: string;
    conversation_id?: string;
    role?: string;
    error?: string;
    metadata?: Record<string, unknown>;
  };
  type?: string;
  id?: string;
  retry?: number;
}

/**
 * Context information for copilot
 */
export interface CopilotContext {
  contextTitle?: string;
  contextData?: Record<string, unknown>;
  windowId?: string;
  tabId?: string;
  recordId?: string;
  userId?: string;
  roleId?: string;
  organizationId?: string;
  clientId?: string;
}

/**
 * Conversation state
 */
export interface CopilotConversation {
  id: string;
  assistantId: string;
  messages: IMessage[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  context?: CopilotContext;
}

/**
 * Error response structure
 */
export interface CopilotErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Upload response structure
 */
export interface CopilotUploadResponse {
  [key: string]: string | undefined;
  success?: string;
  error?: string;
}

/**
 * Message role type
 */
export type MessageRole = (typeof MESSAGE_ROLES)[keyof typeof MESSAGE_ROLES];

/**
 * Event handlers for copilot interactions
 */
export interface CopilotEventHandlers {
  onMessage?: (message: IMessage) => void;
  onError?: (error: CopilotErrorResponse) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onTyping?: (isTyping: boolean) => void;
}

/**
 * Configuration for copilot client initialization
 */
export interface CopilotClientConfig {
  baseUrl?: string;
  token?: string;
  language?: string;
  timeout?: number;
  retryAttempts?: number;
  enableSSE?: boolean;
  enableFileUpload?: boolean;
  interceptor?: import("../client").Interceptor;
}
