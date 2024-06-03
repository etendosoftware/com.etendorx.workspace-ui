import React from 'react';
import {
  userProfileStyles,
  profileImageContainerStyles,
  profileImageStyles,
  svgContainerStyles,
  profileDetailsStyles,
  nameStyles,
  emailStyles,
  logoutButtonStyles,
} from './ProfileModal.styles';
import profilePicture from '../../assets/images/profile_picture.png';
import BackgroundGradient from '../../assets/images/backgroundGradient.svg';
import Logout from '@mui/icons-material/Logout';

const UserProfile: React.FC = () => {
  const user = {
    photoUrl: profilePicture,
    name: 'Ayelén García',
    email: 'ayelen.garcia@etendo.software',
  };

  return (
    <div style={userProfileStyles}>
      <div style={svgContainerStyles}>
        <img src={BackgroundGradient} alt="Background Gradient" />
      </div>
      <div style={logoutButtonStyles}>
        <Logout />
      </div>
      <div style={profileImageContainerStyles}>
        <img src={user.photoUrl} alt="Profile" style={profileImageStyles} />
      </div>
      <p style={nameStyles}>{user.name}</p>
      <div style={profileDetailsStyles}>
        <p style={emailStyles}>{user.email}</p>
      </div>
    </div>
  );
};

export default UserProfile;
