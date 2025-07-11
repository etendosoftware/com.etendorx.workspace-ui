// packages/ComponentLibrary/src/components/Copilot/MessageInput/index.tsx

import type React from "react";
import { useState } from "react";
import { Box, TextField, IconButton as MuiIconButton, InputAdornment } from "@mui/material";
import { Send, AttachFile, Mic } from "@mui/icons-material";

interface MessageInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  placeholder = "Conversa con Copilot...",
  disabled = false,
}) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: "divider",
        backgroundColor: "background.paper",
      }}>
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        variant="outlined"
        size="small"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <MuiIconButton size="small" disabled>
                <AttachFile />
              </MuiIconButton>
              <MuiIconButton onClick={handleSend} disabled={disabled || !message.trim()} color="primary">
                <Send />
              </MuiIconButton>
              <MuiIconButton size="small" disabled>
                <Mic />
              </MuiIconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default MessageInput;
