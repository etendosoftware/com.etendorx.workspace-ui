import React from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { NavStyles, boxStyles } from './Nav.styles';
import RigthButtons from './RigthButtons/Nav.RightButtons';
import Logo from './LeftComponents/Logo';
import { AppIcon } from './LeftComponents/App.Icon';

const Nav: React.FC = () => {
  return (
    <div style={boxStyles}>
      <AppIcon />
      <nav style={NavStyles}>
        <Logo />
        <SearchIcon />
        <div>
          <RigthButtons />
        </div>
      </nav>
    </div>
  );
};

export default Nav;
