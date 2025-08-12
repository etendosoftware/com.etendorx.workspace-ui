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

import { useState, useCallback } from "react";
import { useStyle } from "./styles";
import type { BooleanSelectorProps } from "../../Form/FormView/types";

const BooleanSelector = ({ label, checked, onChange, name, disabled, readOnly }: BooleanSelectorProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { styles } = useStyle();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(name, e.currentTarget.checked);
    },
    [name, onChange]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const isDisabled = readOnly || disabled;

  const checkboxStyle = {
    ...styles.styledCheckbox,
    ...((checked && styles.styledCheckboxChecked) || {}),
    ...((readOnly && styles.disabled) || {}),
  };

  const afterStyle = {
    ...styles.styledCheckboxAfter,
    ...((checked && styles.styledCheckboxCheckedAfter) || {}),
  };

  const borderStyle = {
    ...styles.checkboxBorder,
    ...((isHovered && styles.checkboxBorderHover) || {}),
  };

  return (
    <div style={styles.checkboxContainer} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <label style={styles.checkboxLabel}>
        <input
          type="checkbox"
          style={styles.hiddenCheckbox}
          checked={checked}
          disabled={isDisabled}
          onChange={handleChange}
          name={name}
        />
        <span
          style={{
            ...checkboxStyle,
            ...(isDisabled && styles.disabled),
          }}>
          <span style={afterStyle} />
        </span>
        <span style={{ ...styles.labelText, ...(isDisabled && styles.disabled) }}>{label}</span>
      </label>
      <div style={borderStyle} />
    </div>
  );
};

export default BooleanSelector;
