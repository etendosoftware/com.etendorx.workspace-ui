import React, { memo, useState, useCallback } from 'react';
import { useStyle } from './styles';
import { BooleanSelectorProps } from '../types';

const BooleanSelector: React.FC<BooleanSelectorProps> = memo(({ label, readOnly, checked, onChange, name }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { styles } = useStyle();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(name, e.currentTarget.checked);
    },
    [name, onChange],
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

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
          disabled={readOnly}
          onChange={handleChange}
          name={name}
        />
        <span style={checkboxStyle}>
          <span style={afterStyle} />
        </span>
        <span style={styles.labelText}>{label}</span>
      </label>
      <div style={borderStyle} />
    </div>
  );
});

export default BooleanSelector;
