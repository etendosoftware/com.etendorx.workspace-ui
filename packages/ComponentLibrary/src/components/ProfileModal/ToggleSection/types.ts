import { Item } from '../../enums/index';
import { Role } from '../../../../../MainUI/src/contexts/types';
import { Option } from '../../Input/Select/types';

export interface SelectorListProps {
  section: string;
  passwordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  onRoleChange: (event: React.SyntheticEvent<Element, Event>, value: Option | null) => void;
  onWarehouseChange: (event: React.SyntheticEvent<Element, Event>, value: Option | null) => void;
  roles: Role[];
  selectedRole: Option | null;
  selectedWarehouse: Option | null;
}

export { Item };
