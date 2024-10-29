import { useState, useCallback, useMemo } from 'react';
import { styles } from './styles';
import { BooleanSelectorProps } from '../types';
import { useMetadataContext } from '../../../hooks/useMetadataContext';

const BooleanSelector = ({ field }: BooleanSelectorProps) => {
  const { record } = useMetadataContext();
  const [checked, setChecked] = useState<boolean>(Boolean(record?.[field.original.fieldName]));
  const [hovered, setHovered] = useState(false);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.currentTarget.checked);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
  }, []);

  const checkboxStyle = useMemo(
    () => ({
      ...styles.styledCheckbox,
      ...((checked && styles.styledCheckboxChecked) || {}),
      ...((field.original.readOnly && styles.disabled) || {}),
    }),
    [checked, field.original.readOnly],
  );

  const afterStyle = useMemo(
    () => ({
      ...styles.styledCheckboxAfter,
      ...((checked && styles.styledCheckboxCheckedAfter) || {}),
    }),
    [checked],
  );

  const borderStyle = useMemo(
    () => ({
      ...styles.checkboxBorder,
      ...((hovered && styles.checkboxBorderHover) || {}),
    }),
    [hovered],
  );

  return (
    <div style={styles.checkboxContainer} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <label style={styles.checkboxLabel}>
        <input
          type="checkbox"
          style={styles.hiddenCheckbox}
          checked={checked}
          disabled={field.original.readOnly}
          onChange={handleChange}
        />
        <span style={checkboxStyle}>
          <span style={afterStyle} />
        </span>
        <span style={styles.labelText}>{field.original.name}</span>
      </label>
      <div style={borderStyle} />
    </div>
  );
};

export default BooleanSelector;
