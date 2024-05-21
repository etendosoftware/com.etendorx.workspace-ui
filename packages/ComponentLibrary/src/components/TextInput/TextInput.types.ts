import { TextFieldProps } from '@mui/material';

export type TextInputProps = {
    autoCompleteTexts?: string[];
    fetchSuggestions?: (query: string) => Promise<void>;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    onLeftIconClick?: () => void;
    onRightIconClick?: () => void;
} & TextFieldProps;
