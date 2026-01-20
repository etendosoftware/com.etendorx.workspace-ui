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
 * All Rights Reserved.
 *************************************************************************
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Send from "../../../assets/icons/send.svg";
import AttachFile from "../../../assets/icons/paperclip.svg";
import MicIcon from "../../../assets/icons/mic.svg";
import XIcon from "../../../assets/icons/x.svg";
import IconButton from "../../IconButton";
import ContextPreview from "../ContextPreview";
import type { MessageInputProps } from "../types";

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  placeholder,
  disabled = false,
  contextItems = [],
  onRemoveContext,
  message: externalMessage,
  onMessageChange: externalOnMessageChange,
  translations,
  files = [],
  onFileSelect,
  onRemoveFile,
}) => {
  const [internalMessage, setInternalMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use external state if provided, otherwise use internal state
  const message = externalMessage !== undefined ? externalMessage : internalMessage;
  const setMessage = externalOnMessageChange || setInternalMessage;

  const handleVoiceClick = useCallback(() => alert("Voice activated"), []);

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles && selectedFiles.length > 0 && onFileSelect) {
        const filesArray = Array.from(selectedFiles);
        onFileSelect(filesArray);
      }
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onFileSelect]
  );

  const handleSend = useCallback(() => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      // Reset height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [message, disabled, onSendMessage, setMessage]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`; // Max height approx 4-5 lines
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [message, adjustHeight]);

  return (
    <div className="px-2 pb-1 w-full">
      <ContextPreview
        contextItems={contextItems}
        onRemoveContext={onRemoveContext || (() => {})}
        showRemoveButton={!!onRemoveContext}
        translations={{
          selectedRegisters: translations?.selectedRegisters || "",
        }}
      />

      {/* Attached Files Preview */}
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm">
              <span className="text-gray-700 truncate max-w-[200px]" title={file.name}>
                {file.name}
              </span>
              <span className="text-gray-500 text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
              {onRemoveFile && (
                <button
                  type="button"
                  onClick={() => onRemoveFile(index)}
                  className="text-gray-500 hover:text-red-600 transition-colors"
                  aria-label={`Remove ${file.name}`}>
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        className={`
          flex items-end gap-2 p-2 rounded-2xl border bg-white transition-colors duration-200
          ${
            isFocused
              ? "border-[#002f5c]" // Focus color (using a deep blue similar to the screenshot)
              : "border-gray-300"
          }
           ${disabled ? "opacity-60 bg-gray-50 cursor-not-allowed" : ""}
        `}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          aria-label="Attach files"
        />

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={translations?.placeholder || placeholder}
          disabled={disabled}
          rows={1}
          className="w-full resize-none border-none outline-none bg-transparent text-sm text-gray-800 placeholder-gray-400 py-2 pl-2 max-h-[120px] overflow-y-auto"
          style={{ minHeight: "24px" }}
        />

        <div className="flex items-center gap-1 pb-0.5 shrink-0">
          <IconButton
            onClick={handleAttachClick}
            disabled={disabled || !onFileSelect}
            className={`
              rounded-full w-8 h-8 flex items-center justify-center transition-colors
              ${!disabled && onFileSelect ? "text-[#002f5c] hover:bg-blue-50" : "text-gray-300"}
            `}>
            <AttachFile className="w-5 h-5" />
          </IconButton>

          <IconButton
            onClick={handleSend}
            disabled={disabled || !message.trim()}
            className={`
               rounded-full w-8 h-8 flex items-center justify-center transition-colors
              ${!disabled && message.trim() ? "text-[#002f5c] hover:bg-blue-50" : "text-gray-300"}
            `}>
            <Send className="w-5 h-5" />
          </IconButton>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          <IconButton
            onClick={handleVoiceClick}
            disabled
            className="text-gray-500 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center transition-colors">
            <MicIcon className="w-5 h-5" />
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
