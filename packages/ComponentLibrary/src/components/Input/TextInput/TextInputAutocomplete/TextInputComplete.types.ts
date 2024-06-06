import { StandardTextFieldProps } from '@mui/material';

export interface TextInputProps extends StandardTextFieldProps {
    setValue?: (value: string) => void;
    autoCompleteTexts?: string[];
    fetchSuggestions?: (query: string) => Promise<void>;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    onLeftIconClick?: () => void;
    onRightIconClick?: () => void;
}
