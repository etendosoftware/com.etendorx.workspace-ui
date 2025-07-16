import { useStyle } from "./styles";
import type { ToggleSectionsProps } from "./types";
import Button from "../../../../ComponentLibrary/src/components/Button/Button";
const ToggleSections: React.FC<ToggleSectionsProps> = ({ sections, currentSection, onToggle }) => {
  const { styles } = useStyle();

  return (
    <div style={styles.toggleContainerStyles}>
      {sections.map(({ id, label, icon }) => {
        const isActive = currentSection === id;
        return (
          <Button
            key={id}
            variant={"outlined"}
            className={`${isActive && "bg-white"} cursor-pointer flex-[1_0_0] border-0`}
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
