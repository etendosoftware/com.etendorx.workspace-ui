import type React from "react";
import { useCallback, useState } from "react";
import { Box, InputAdornment } from "@mui/material";
import Send from "../../../assets/icons/send.svg";
import AttachFile from "../../../assets/icons/paperclip.svg";
import IconButton from "../../IconButton";
import { SearchInputWithVoice } from "../..";

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
  const handleVoiceClick = useCallback(() => alert("Voice activated"), []);

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
      <SearchInputWithVoice
        value={message}
        setValue={setMessage}
        placeholder={placeholder}
        disabled={disabled}
        multiline
        maxRows={4}
        onKeyDown={handleKeyPress}
        rightIcon={true}
        onVoiceClick={handleVoiceClick}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton disabled className="[&>svg]:text-[1.25rem]">
                <AttachFile />
              </IconButton>
              <IconButton
                className="[&>svg]:text-[1.25rem] pr-0.5"
                onClick={handleSend}
                disabled={disabled || !message.trim()}>
                <Send />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default MessageInput;
