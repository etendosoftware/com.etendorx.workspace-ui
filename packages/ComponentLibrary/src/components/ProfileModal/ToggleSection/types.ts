import { Item } from '../../enums/index';
import { Role } from '../../../../../MainUI/src/contexts/types';
export interface SelectorListProps {
  section: string;
  passwordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  onRoleChange: (roleId: string) => void;
  roles: Role[];
  currentRole: Role | null;
}

export { Item };
