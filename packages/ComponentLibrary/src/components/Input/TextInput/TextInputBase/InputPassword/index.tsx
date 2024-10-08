import React, { useState } from 'react';
import { IconButton } from '@mui/material';
import { VisibilityOutlined, VisibilityOffOutlined } from '@mui/icons-material';
import TextInputBase from '../TextInputBase';
import { TextInputProps } from '../../TextInputAutocomplete/TextInputComplete.types';
import { theme } from '../../../../../theme';

const InputPassword = (props: TextInputProps) => {
    const { value, setValue, label, leftIcon, onLeftIconClick, ...otherProps } = props;

    const [showPassword, setShowPassword] = useState<boolean>(false);

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    return (
        <TextInputBase
            value={value}
            setValue={setValue}
            label={label}
            leftIcon={leftIcon}
            onLeftIconClick={onLeftIconClick}
            type={showPassword ? 'text' : 'password'}
            rightIcon={
                <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    size="small"
                    sx={{ color: theme.palette.baselineColor.neutral[60] }}
                >
                    {showPassword ? <VisibilityOutlined sx={{ width: 20 }} /> : <VisibilityOffOutlined sx={{ width: 20 }} />}
                </IconButton>
            }
            {...otherProps}
        />
    );
};

export default InputPassword;
