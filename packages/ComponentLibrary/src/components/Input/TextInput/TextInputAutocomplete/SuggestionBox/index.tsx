import { Box } from '@mui/material';
import TabIcon from '@mui/icons-material/KeyboardTab';
import { SX_STYLES, CSS_STYLES } from '../TextInputAutocomplete.styles';
import t from '../TextInputAutocomplete.translations.json';

export interface SuggestionBoxProps {
  suggestion: string;
  value: string;
}

const SuggestionBox = ({ suggestion, value }: SuggestionBoxProps) => {
  return (
    <Box sx={SX_STYLES.suggestionBox}>
      <span style={CSS_STYLES.spanOpacity}>{value}</span>
      <span style={CSS_STYLES.suggestionText}>
        {suggestion.slice(value.length)}
      </span>
      <Box sx={SX_STYLES.tabBox}>
        <TabIcon sx={SX_STYLES.tabIcon} />
        <p style={CSS_STYLES.tabText}>{t.tab}</p>
      </Box>
    </Box>
  );
};

export default SuggestionBox;
