import React from 'react';
import { ProcessButtonProps } from './types';
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';

const GenericProcessButton: React.FC<ProcessButtonProps> = ({ onExecute }) => {
  const handleExecute = () => {
    if (onExecute) {
      onExecute();
    }
  };

  return <IconButton onClick={handleExecute}></IconButton>;
};

export default GenericProcessButton;
