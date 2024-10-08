import React from 'react';
import { styles } from './ProfileModal.styles';
import BackgroundGradientUrl from '../../assets/images/backgroundGradient.svg?url';
import Logout from '../../assets/icons/log-out.svg';
import { User } from './UserProfile.types';
import IconButton from '../IconButton';

const UserProfile: React.FC<User> = ({
  photoUrl,
  name,
  email,
  sestionTooltip,
}) => {
  return (
    <div style={styles.userProfileStyles}>
      <div style={styles.svgContainerStyles}>
        <img src={BackgroundGradientUrl} alt="Background Gradient" />
      </div>
      <IconButton style={styles.logoutButtonStyles} tooltip={sestionTooltip}>
        <Logout />
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
