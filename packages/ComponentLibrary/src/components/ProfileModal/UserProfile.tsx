import { styles } from './styles';
import BackgroundGradientUrl from '../../../public/images/backgroundGradient.svg';
import Logout from '../../../public/icons/log-out.svg';
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
        <BackgroundGradientUrl />
      </div>
      <IconButton
        style={styles.logoutButtonStyles}
        tooltip={sectionTooltip}
        width={16}
        height={16}
        onClick={handleSignOff}>
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
