import { Box } from '@mui/material';
import TabIcon from '@mui/icons-material/KeyboardTab';
import t from '../TextInputAutocomplete.translations.json';
import { useStyle } from '../TextInputAutocomplete.styles';

export interface SuggestionBoxProps {
  suggestion: string;
  value: string;
}

const SuggestionBox = ({ suggestion, value }: SuggestionBoxProps) => {
  const { sx, styles } = useStyle();
  return (
    <Box sx={sx.suggestionBox}>
      <span style={styles.spanOpacity}>{value}</span>
      <span style={styles.suggestionText}>{suggestion.slice(value.length)}</span>
      <Box sx={sx.tabBox}>
        <TabIcon sx={sx.tabIcon} />
        <p style={styles.tabText}>{t.tab}</p>
      </Box>
    </Box>
  );
};

export default SuggestionBox;
