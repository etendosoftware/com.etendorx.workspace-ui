import { useCallback } from 'react';
import { useStyle, TEXT_LOGO } from './styles';
import BackgroundGradient from '../../assets/images/backgroundGradient.svg?url';
import LogoutIcon from '../../assets/icons/log-out.svg';
import IconButton from '../IconButton';
import { UserProfileProps } from './types';

const UserProfile: React.FC<UserProfileProps> = ({ photoUrl, name, email, sectionTooltip, onSignOff }) => {
  const { styles } = useStyle();

  const handleSignOff = useCallback(() => {
    onSignOff();
  }, [onSignOff]);

  return (
    <div style={styles.userProfileStyles}>
      <div style={styles.svgContainerStyles}>
        <img src={BackgroundGradient} alt="Background Gradient" />
      </div>
      <IconButton
        style={styles.logoutButtonStyles}
        tooltip={sectionTooltip}
        width={16}
        height={16}
        onClick={handleSignOff}>
        <LogoutIcon />
      </IconButton>
      <div style={styles.profileImageContainerStyles}>
        {photoUrl ? (
          <img src={photoUrl} alt="Profile" style={styles.profileImageStyles} />
        ) : (
          <div
            style={{
              ...styles.profileImageStyles,
              ...styles.profileWithoutImage,
            }}>
            {TEXT_LOGO}
          </div>
        )}
      </div>
      <p style={styles.nameStyles}>{name}</p>
      <div style={styles.profileDetailsStyles}>
        <p style={styles.emailStyles}>{email}</p>
      </div>
    </div>
  );
};

export default UserProfile;
