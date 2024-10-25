import { styles } from './styles';
import BackgroundGradient from '../../assets/images/backgroundGradient.svg?url';
import LogoutIcon from '../../assets/icons/log-out.svg';
import { User } from './types';
import IconButton from '../IconButton';
import { UserContext } from '../../../../MainUI/contexts/user';
import { useCallback, useContext } from 'react';

const UserProfile: React.FC<User> = ({ photoUrl, name, email, sectionTooltip }) => {
  const { clearUserData } = useContext(UserContext);

  const handleSignOff = useCallback(() => {
    clearUserData();
  }, [clearUserData]);

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
