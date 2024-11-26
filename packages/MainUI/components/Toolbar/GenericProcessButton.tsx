import React from 'react';
import { ProcessButtonProps } from './types';
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';

const GenericProcessButton: React.FC<ProcessButtonProps> = ({ button, onClick, disabled }) => {
  return (
    <IconButton
      onClick={onClick}
      disabled={disabled}
      title={button.name}
      data-testid={`process-button-${button.id}`}
      style={{
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    />
  );
};

export default GenericProcessButton;
