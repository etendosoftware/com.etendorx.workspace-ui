import React from 'react';
import { styles } from './ProfileModal.styles';
import BackgroundGradient from '../../assets/images/backgroundGradient.svg';
import Logout from '@mui/icons-material/Logout';
import { User } from './UserProfile.types';
import { IconButton } from '@mui/material';
import { sx } from '../Waterfall/WaterfallModal.styles';

const UserProfile: React.FC<User> = ({ photoUrl, name, email }) => {
  return (
    <div style={styles.userProfileStyles}>
      <div style={styles.svgContainerStyles}>
        <img src={BackgroundGradient} alt="Background Gradient" />
      </div>
      <IconButton style={styles.logoutButtonStyles} sx={sx.hoverStyles}>
        <Logout sx={styles.iconStyles} />
      </IconButton>
      <div style={styles.profileImageContainerStyles}>
        <img src={photoUrl} alt="Profile" style={styles.profileImageStyles} />
      </div>
      <p style={styles.nameStyles}>{name}</p>
      <div style={styles.profileDetailsStyles}>
        <p style={styles.emailStyles}>{email}</p>
      </div>
    </div>
  );
};

export default UserProfile;
