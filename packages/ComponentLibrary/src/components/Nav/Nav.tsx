import React from 'react';
import SearchIcon from '../../assets/icons/search.svg';
import { NavStyles, boxStyles } from './Nav.styles';
import RigthButtons from './RigthComponents/RightButtons';
import Logo from './LeftComponents/Logo';
import { AppIcon } from './LeftComponents/IconApp';

const Nav: React.FC = () => {
  return (
    <div style={boxStyles}>
      <AppIcon />
      <nav style={NavStyles}>
        <Logo />
        <SearchIcon fill="blue" width={100} height={100} />
        <RigthButtons />
      </nav>
    </div>
  );
};

export default Nav;
