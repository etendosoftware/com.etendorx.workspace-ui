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
 *************************************************************************
 */

import { memo, useRef } from "react";
import { InputAdornment, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import CalendarIcon from "@workspaceui/componentlibrary/src/assets/icons/calendar.svg";
import type { DateSelectorProps } from "../../Form/FormView/types";
import { IconButton } from "@workspaceui/componentlibrary/src/components";
const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiInputBase-root": {
    borderRadius: theme.shape.borderRadius,
  },
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 0, 1, 1.5),
    margin: 0,
    "&::-webkit-calendar-picker-indicator": {
      display: "none",
    },
  },
}));

const INPUT_LABEL_PROPS = { shrink: true } as const;

const DateSelector = memo(
  ({ label, name, value, onChange, onBlur, readOnly, required, error, helperText }: DateSelectorProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      if (newValue) {
        const [year, month, day] = newValue.split("-");
        const formattedDate = `${day}/${month}/${year}`;
        onChange({
          target: {
            name,
            value: formattedDate,
          },
        });
      } else {
        onChange(event);
      }
    };

    const handleIconClick = () => {
      if (inputRef.current && !readOnly) {
        inputRef.current.showPicker();
      }
    };

    const formatDateForInput = (dateString?: string) => {
      if (!dateString) return "";
      const [day, month, year] = dateString.split("/");
      return `${year}-${month}-${day}`;
    };

    return (
      <StyledTextField
        fullWidth
        label={label}
        name={name}
        type="date"
        variant="standard"
        margin="normal"
        value={formatDateForInput(value)}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={readOnly}
        required={required}
        error={error}
        helperText={helperText}
        inputRef={inputRef}
        InputLabelProps={INPUT_LABEL_PROPS}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={handleIconClick} disabled={readOnly} className="w-1 h-1">
                <CalendarIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    );
  }
);

DateSelector.displayName = "DateSelector";

export default DateSelector;
