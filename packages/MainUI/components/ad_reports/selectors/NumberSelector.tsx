import { memo } from "react";
import { TextField } from "@mui/material";
import type { NumberSelectorProps } from "../../Form/FormView/types";

const NumberSelector: React.FC<NumberSelectorProps> = memo(({ name, value, readOnly, onChange }) => (
  <TextField
    fullWidth
    margin="normal"
    name={name}
    type="number"
    value={value}
    onChange={(e) => onChange(name, Number(e.target.value))}
    disabled={readOnly}
  />
));

NumberSelector.displayName = "NumberSelector";

export default NumberSelector;
