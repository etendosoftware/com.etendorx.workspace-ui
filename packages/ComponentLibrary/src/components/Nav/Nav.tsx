'use client';

import React, { ReactNode, useState } from 'react';
import styles from './Nav.styles';
import RightButtons from './RigthComponents/RightButtons';
import SearchInputWithVoice from '../Input/TextInput/TextInputAutocomplete/SearchInputWithVoice';
export interface NavProps {
  children?: ReactNode;
}

const Nav: React.FC<NavProps> = ({ children }) => {
  const [value, setValue] = useState('');
  return (
    <nav style={styles.NavStyles}>
      <div style={styles.LeftItems}>
        <SearchInputWithVoice
          value={value}
          setValue={setValue}
          placeholder="Search"
          onVoiceClick={() => alert('Voice activated')}
        />
      </div>
      <div style={styles.RightItems}>
        <RightButtons>{children}</RightButtons>
      </div>
    </nav>
  );
};

export default Nav;
