import type React from "react";
import { useEffect, useRef } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
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
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          {labels.ETCOP_Welcome_Message || "¡Hola! ¿En qué puedo ayudarte hoy?"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}>
      {messages.map((message, index) => (
        <Box
          key={index}
          sx={{
            display: "flex",
            justifyContent: message.sender === "user" ? "flex-end" : "flex-start",
            mb: 1,
          }}>
          <Box
            sx={{
              maxWidth: "70%",
              p: 2,
              borderRadius: 2,
              backgroundColor: message.sender === "user" ? "primary.main" : "grey.100",
              color: message.sender === "user" ? "white" : "text.primary",
            }}>
            <Typography variant="body1" sx={{ mb: 0.5 }}>
              {message.text}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {message.timestamp}
            </Typography>
          </Box>
        </Box>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 2,
              borderRadius: 2,
              backgroundColor: "grey.100",
            }}>
            <CircularProgress size={16} />
            <Typography variant="body2">Escribiendo...</Typography>
          </Box>
        </Box>
      )}

      <div ref={messagesEndRef} />
    </Box>
  );
};

export default MessageList;
