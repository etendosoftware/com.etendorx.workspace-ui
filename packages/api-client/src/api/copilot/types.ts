export interface IAssistant {
  app_id: string;
  name: string;
  description?: string;
}

export interface IMessage {
  message_id?: string;
  text: string;
  response?: string;
  sender: string;
  timestamp: string;
  file?: string;
  files?: { name: string }[];
  context?: string;
  role?: string;
}

export interface ILabels {
  [key: string]: string;
}

export interface CopilotQuestionParams {
  question: string;
  app_id?: string;
  conversation_id?: string;
  file?: string[];
}

export interface CopilotUploadConfig {
  file: (string | File)[] | null;
  url: string;
  method: string;
}

export interface CopilotResponse {
  answer?: {
    response?: string;
    conversation_id?: string;
    role?: string;
    error?: string;
  };
  error?: string;
}
