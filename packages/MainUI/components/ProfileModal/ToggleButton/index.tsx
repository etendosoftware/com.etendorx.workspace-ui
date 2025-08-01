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
