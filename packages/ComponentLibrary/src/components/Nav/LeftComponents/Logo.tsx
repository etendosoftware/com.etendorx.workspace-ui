import React from 'react';
import {
  logoContainerStyles,
  logoStyles,
  companyNameStyles,
} from '../Nav.styles';
import LogoImage from '../../assets/images/logo.svg';

const Logo: React.FC = () => {
  return (
    <div style={logoContainerStyles}>
      <img src={LogoImage} alt="Company Logo" style={logoStyles} />
      <span style={companyNameStyles}>Etendo</span>
    </div>
  );
};

export default Logo;
