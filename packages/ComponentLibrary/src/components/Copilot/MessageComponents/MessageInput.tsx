import { useCallback, useState } from "react";
import { InputAdornment } from "@mui/material";
import Send from "../../../assets/icons/send.svg";
import AttachFile from "../../../assets/icons/paperclip.svg";
import IconButton from "../../IconButton";
import { SearchInputWithVoice } from "../..";
import ContextPreview from "../ContextPreview";
import type { MessageInputProps } from "../types";

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  placeholder,
  disabled = false,
  contextItems = [],
  onRemoveContext,
  translations,
}) => {
  const [message, setMessage] = useState("");

  const handleVoiceClick = useCallback(() => alert("Voice activated"), []);

  const handleSend = useCallback(() => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  }, [message, disabled, onSendMessage]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="px-2 pb-1">
      <ContextPreview
        contextItems={contextItems}
        onRemoveContext={onRemoveContext || (() => {})}
        showRemoveButton={!!onRemoveContext}
        translations={{
          selectedRegisters: translations?.selectedRegisters || "",
        }}
      />
      <SearchInputWithVoice
        value={message}
        setValue={setMessage}
        placeholder={translations?.placeholder || placeholder}
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
