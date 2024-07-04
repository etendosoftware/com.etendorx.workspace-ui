import React from 'react';
import { styles } from './ProfileModal.styles';
import BackgroundGradient from '../../assets/images/backgroundGradient.svg';
import Logout from '@mui/icons-material/Logout';
import { user } from './UserMock';

const UserProfile: React.FC = () => {
  return (
    <div style={styles.userProfileStyles}>
      <div style={styles.svgContainerStyles}>
        <img src={BackgroundGradient} alt="Background Gradient" />
      </div>
      <div style={styles.logoutButtonStyles}>
        <Logout />
      </div>
      <div style={styles.profileImageContainerStyles}>
        <img
          src={user.photoUrl}
          alt="Profile"
          style={styles.profileImageStyles}
        />
      </div>
      <p style={styles.nameStyles}>{user.name}</p>
      <div style={styles.profileDetailsStyles}>
        <p style={styles.emailStyles}>{user.email}</p>
      </div>
    </div>
  );
};

export default UserProfile;
