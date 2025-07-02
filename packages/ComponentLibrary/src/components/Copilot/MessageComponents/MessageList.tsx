import { Box, Typography } from "@mui/material";
import type { IMessage, ILabels } from "@workspaceui/api-client/src/api/copilot";

interface MessageListProps {
  messages: IMessage[];
  labels: ILabels;
  isExpanded?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, labels }) => {
  if (messages.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography color="text.secondary">
          {labels.ETCOP_Welcome_Message || "¡Hola! ¿En qué puedo ayudarte hoy?"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {messages.map((message, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Typography>{message.text}</Typography>
        </Box>
      ))}
    </Box>
  );
};

export default MessageList;
