import React, { memo, useState, useCallback } from 'react';
import { styles } from './styles';
import { BooleanSelectorProps } from '../types';

const BooleanSelector: React.FC<BooleanSelectorProps> = memo(
  ({ label, readOnly, checked: externalChecked, onChange }) => {
    const [internalChecked, setInternalChecked] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const isChecked =
      externalChecked !== undefined ? externalChecked : internalChecked;

    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const newChecked = event.target.checked;
        if (externalChecked === undefined) {
          setInternalChecked(newChecked);
        }
        onChange?.(newChecked);
      },
      [externalChecked, onChange],
    );

    const checkboxStyle = {
      ...styles.styledCheckbox,
      ...(isChecked ? styles.styledCheckboxChecked : {}),
      ...(readOnly ? styles.disabled : {}),
    };

    const afterStyle = {
      ...styles.styledCheckboxAfter,
      ...(isChecked ? styles.styledCheckboxCheckedAfter : {}),
    };

    const borderStyle = {
      ...styles.checkboxBorder,
      ...(isHovered ? styles.checkboxBorderHover : {}),
    };

    return (
      <div
        style={styles.checkboxContainer}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            style={styles.hiddenCheckbox}
            checked={isChecked}
            disabled={readOnly}
            onChange={handleChange}
          />
          <span style={checkboxStyle}>
            <span style={afterStyle} />
          </span>
          <span style={styles.labelText}>{label}</span>
        </label>
        <div style={borderStyle} />
      </div>
    );
  },
);

export default BooleanSelector;
