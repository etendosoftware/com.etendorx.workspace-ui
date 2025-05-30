import { Button, useTheme } from "@mui/material";
import { useStyle } from "./styles";
import type { ToggleSectionsProps } from "./types";

const ToggleSections: React.FC<ToggleSectionsProps> = ({ sections, currentSection, onToggle }) => {
  const theme = useTheme();
  const { styles } = useStyle();

  return (
    <div style={styles.toggleContainerStyles}>
      {sections.map(({ id, label, icon }) => {
        const isActive = currentSection === id;
        return (
          <Button
            key={id}
            style={{
              ...styles.toggleButtonStyles,
              backgroundColor: isActive ? theme.palette.baselineColor.neutral[0] : "",
            }}
            onClick={() => onToggle(id)}
            startIcon={isActive ? icon : null}>
            {label}
          </Button>
        );
      })}
    </div>
  );
};

export default ToggleSections;
