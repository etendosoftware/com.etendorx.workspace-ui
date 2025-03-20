import { useState, useCallback } from 'react';
import { useStyle } from './styles';
import { BooleanSelectorProps } from '../../Form/FormView/types';

const BooleanSelector = ({ label, checked, onChange, name, disabled, readOnly }: BooleanSelectorProps) => {
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
