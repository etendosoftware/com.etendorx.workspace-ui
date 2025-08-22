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
    data-testid="TextField__4b2b7e"
  />
));

NumberSelector.displayName = "NumberSelector";

export default NumberSelector;
