import { useCallback } from 'react';
import { useStyle, TEXT_LOGO } from './styles';
import BackgroundGradient from '../../assets/images/backgroundGradient.svg?url';
import LogoutIcon from '../../assets/icons/log-out.svg';
import IconButton from '../IconButton';
import { UserProfileProps } from './types';

const UserProfile: React.FC<UserProfileProps> = ({ photoUrl, name, sectionTooltip, onSignOff }) => {
  const { styles } = useStyle();

  const handleSignOff = useCallback(() => {
    onSignOff();
  }, [onSignOff]);

  return (
    <div style={styles.userProfileStyles}>
      <div style={styles.svgContainerStyles}>
        <img src={BackgroundGradient} alt="Background Gradient" />
      </div>
      <div className="absolute top-4 right-4 z-10">
        <IconButton tooltip={sectionTooltip} onClick={handleSignOff} className="h-6 w-6 [&>svg]:w-4 [&>svg]:h-4">
          <LogoutIcon />
        </IconButton>
      </div>
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
      {/* <p style={styles.nameStyles}>{name}</p> */}
      <div style={styles.profileDetailsStyles}>
        <p style={styles.emailStyles}>{name}</p>
      </div>
    </div>
  );
};

export default UserProfile;
