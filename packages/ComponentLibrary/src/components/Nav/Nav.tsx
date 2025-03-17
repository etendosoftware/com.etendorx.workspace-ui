'use client';

import React, { ReactNode, useCallback, useState } from 'react';
import RightButtons from './RigthComponents/RightButtons';
import SearchInputWithVoice from '../Input/TextInput/TextInputAutocomplete/SearchInputWithVoice';
import { useStyle } from './Nav.styles';
export interface NavProps {
  children?: ReactNode;
}

const Nav: React.FC<NavProps> = ({ children }) => {
  const { styles } = useStyle();
  const [value, setValue] = useState('');
  const handleVoiceClick = useCallback(() => alert('Voice activated'), []);

  return (
    <nav style={styles.NavStyles}>
      <div style={styles.LeftItems}>
        <SearchInputWithVoice value={value} setValue={setValue} placeholder="Search" onVoiceClick={handleVoiceClick} />
      </div>
      <div style={styles.RightItems}>
        <RightButtons>{children}</RightButtons>
      </div>
    </nav>
  );
};

export default Nav;
