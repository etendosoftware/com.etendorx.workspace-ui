"use client";

import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Autocomplete,
  type AutocompleteRenderInputParams,
  FormHelperText,
  InputAdornment,
  Paper,
  type PaperProps,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import type React from "react";
import { useState } from "react";
import { useStyle } from "./style";
import type { ISelectInput, Option as BaseOption } from "./types";

type OptionProps = React.HTMLAttributes<HTMLLIElement> & { key?: string };
type Option<T extends string = string> = BaseOption<T> & {
  iconLeft?: React.ReactNode;
}

const Select: React.FC<ISelectInput> = ({
  title,
  iconLeft,
  options = [],
  disabled = false,
  helperText,
  name,
  ...props
}) => {
  const { sx } = useStyle();
  const theme = useTheme();
  const [inputValue, setInputValue] = useState<string>("");
  const [focused, setFocused] = useState<boolean>(false);

  const CustomPaper: React.FC<PaperProps> = (paperProps) => {
    return <Paper {...paperProps} sx={sx.optionsContainer} />;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
    setInputValue("");
  };

  const handleSelectionChange = (event: React.SyntheticEvent<Element, Event>, value: Option | null) => {
    props.onChange?.(event, value);
  };

  const getBackgroundFocus = (): string => {
    if (!focused || inputValue) {
      return "transparent";
    }
    return theme.palette.baselineColor.neutral[0];
  };

  const renderInput = (params: AutocompleteRenderInputParams) => (
    <TextField
      {...params}
      sx={{
        ...sx.root,
        "& .MuiInput-root": {
          ...sx.root["& .MuiInput-root"],
          backgroundColor: getBackgroundFocus(),
        },
      }}
      InputLabelProps={{
        style: sx.labelProps,
        shrink: true,
      }}
      InputProps={{
        ...params.InputProps,
        name,
        sx: sx.props,
        startAdornment: iconLeft && <InputAdornment position="start">{iconLeft}</InputAdornment>,
        endAdornment: <div style={sx.buttonsContainer}>{params.InputProps.endAdornment}</div>,
      }}
      label={title}
      variant="standard"
      onChange={handleInputChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      name={name}
    />
  );

  const renderOption = (params: OptionProps, option: Option<string>, { selected }: { selected: boolean }) => {
    const { key, ...otherParams } = params;
    return (
      <li
        key={option.value + params.key}
        style={{
          ...sx.optionContainer,
          backgroundColor: selected ? theme.palette.baselineColor.neutral[0] : undefined,
        }}
        {...otherParams}
      >
        {option?.iconLeft && <div style={{marginRight: "0.5rem"}}>{option.iconLeft}</div>}
        <Typography
          className="textOption"
          color={selected ? theme.palette.dynamicColor.dark : theme.palette.baselineColor.neutral[90]}
          style={sx.optionText}
        >
          {option.title}
        </Typography>
        {selected && <CheckCircleIcon style={sx.checkIcon} />}
      </li>
    );
  };

  return (
    <>
      <Autocomplete
        {...props}
        disabled={disabled}
        options={options}
        getOptionLabel={(option) => option.title}
        clearIcon={<CancelIcon style={sx.dropdownIcons} />}
        popupIcon={<ExpandMoreIcon style={sx.dropdownIcons} />}
        renderInput={renderInput}
        sx={sx.autocomplete}
        PaperComponent={CustomPaper}
        ListboxProps={{
          sx: sx.listBox,
        }}
        onChange={handleSelectionChange}
        renderOption={renderOption}
      />
      {helperText && (
        <FormHelperText component="div" style={sx.helperTextContainer}>
          {helperText.icon}
          {helperText.label && <span style={sx.helperText}>{helperText.label}</span>}
        </FormHelperText>
      )}
    </>
  );
};

export default Select;
