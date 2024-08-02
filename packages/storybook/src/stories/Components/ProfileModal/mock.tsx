import { Section } from '../../../../../ComponentLibrary/src/components/ProfileModal/ToggleButton/types';
import PersonOutlineIcon from '../../../../../ComponentLibrary/src/assets/icons/check-circle.svg';
import LockIcon from '../../../../../ComponentLibrary/src/assets/icons/lock.svg';
import { defaultFill } from '../../../../../ComponentLibrary/src/components/ProfileModal/ToggleSection/styles';

export const sections: Section[] = [
  {
    id: 'profile',
    label: 'Perfil',
    icon: <PersonOutlineIcon fill={defaultFill} />,
  },
  {
    id: 'password',
    label: 'Contraseña',
    icon: <LockIcon fill={defaultFill} />,
  },
];
