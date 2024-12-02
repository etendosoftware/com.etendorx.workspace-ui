import React from 'react';
import { ProcessButtonProps } from './types';
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';

const disabledStyle = {
  opacity: 0.5,
  cursor: 'not-allowed',
};
const enabledStyle = {
  opacity: 1,
  cursor: 'pointer',
};

const GenericProcessButton: React.FC<ProcessButtonProps> = ({ button, onClick, disabled }) => {
  return (
    <IconButton
      onClick={onClick}
      disabled={disabled}
      title={button.name}
      data-testid={`process-button-${button.id}`}
      style={disabled ? disabledStyle : enabledStyle}
    />
  );
};

export default GenericProcessButton;
