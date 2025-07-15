import type React from "react";
import { useCallback, useState } from "react";
import { InputAdornment } from "@mui/material";
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
    <div className="px-2 pb-1">
      <SearchInputWithVoice
        value={message}
        setValue={setMessage}
        placeholder={placeholder}
        disabled={disabled}
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
    </div>
  );
};

export default MessageInput;
