"use client";

import { memo, useCallback, useState } from "react";
import { InputAdornment, Box } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterIcon from "@mui/icons-material/FilterList";
import MicIcon from "../../../../../assets/icons/mic.svg";
import MicOffIcon from "../../../../../assets/icons/mic-off.svg";
import type { TextInputProps } from "../TextInputComplete.types";
import TextInputAutoComplete from "../TextInputAutocomplete";
import IconButton from "../../../../IconButton";

export interface SearchInputWithVoiceProps extends TextInputProps {
  onVoiceClick?: () => void;
  disabled?: boolean;
}

const StartAdornment = () => {
  return (
    <InputAdornment position="start">
      <SearchIcon />
    </InputAdornment>
  );
};

const EndAdornment = () => {
  return (
    <InputAdornment position="end">
      <IconButton>
        <FilterIcon />
      </IconButton>
    </InputAdornment>
  );
};

const SearchInputWithVoice = ({ onVoiceClick, disabled = false, ...props }: SearchInputWithVoiceProps) => {
  const [isRecording, setIsRecording] = useState(false);

  const handleVoiceClick = useCallback(() => {
    if (disabled) return;
    setIsRecording(!isRecording);
    onVoiceClick?.();
  }, [isRecording, onVoiceClick, disabled]);

  const wrapperStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    cursor: disabled ? "not-allowed" : "default",
    pointerEvents: disabled ? "none" : "auto",
    position: "relative",
  };

  const overlayStyle = disabled
    ? {
        position: "absolute" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "transparent",
        cursor: "not-allowed",
        zIndex: 10,
        pointerEvents: "auto" as const,
      }
    : {};

  return (
    <Box sx={{ position: "relative" }}>
      <Box sx={wrapperStyle}>
        <TextInputAutoComplete
          {...props}
          InputProps={{
            ...props.InputProps,
            startAdornment: <StartAdornment />,
            endAdornment: <EndAdornment />,
            style: { height: "2.5rem" },
          }}
          disabled={disabled}
        />
        <Box
          sx={{
            width: "2.5rem",
            height: "2.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "6.25rem",
          }}>
          <IconButton onClick={handleVoiceClick} className="w-10 h-10" disabled={true}>
            {isRecording ? <MicOffIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
          </IconButton>
        </Box>
      </Box>
      {disabled && <Box sx={overlayStyle} onClick={(e) => e.preventDefault()} />}
    </Box>
  );
};

export default memo(SearchInputWithVoice);
