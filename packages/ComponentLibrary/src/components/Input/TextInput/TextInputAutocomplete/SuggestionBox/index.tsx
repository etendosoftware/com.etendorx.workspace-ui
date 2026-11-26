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

import { Box } from "@mui/material";
import TabIcon from "@mui/icons-material/KeyboardTab";
import { useStyle } from "../TextInputAutocomplete.styles";

/**
 * Markers of the parts of the suggestion, so a container can restyle them with its own
 * tokens (the sidebar search does). The inline styles below stay the default everywhere else.
 */
export const SUGGESTION_ATTRIBUTES = {
  BOX: "data-autocomplete-ghost",
  TEXT: "data-autocomplete-suggestion",
  TAB_HINT: "data-autocomplete-tab-hint",
} as const;

export interface SuggestionBoxProps {
  suggestion: string;
  value: string;
}

const SuggestionBox = ({ suggestion, value }: SuggestionBoxProps) => {
  const { sx, styles } = useStyle();
  return (
    <Box sx={sx.suggestionBox} {...{ [SUGGESTION_ATTRIBUTES.BOX]: "" }}>
      <span style={styles.spanOpacity}>{value}</span>
      <span style={styles.suggestionText} {...{ [SUGGESTION_ATTRIBUTES.TEXT]: "" }}>
        {suggestion.slice(value.length)}
      </span>
      <Box sx={sx.tabBox} {...{ [SUGGESTION_ATTRIBUTES.TAB_HINT]: "" }}>
        <TabIcon sx={sx.tabIcon} />
        <p style={styles.tabText}>Tab</p>
      </Box>
    </Box>
  );
};

export default SuggestionBox;
