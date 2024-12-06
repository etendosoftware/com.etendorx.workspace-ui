import {
  BaseProfileModalProps,
  BaseWarehouse,
  BaseDefaultConfiguration,
  Logger,
} from '@workspaceui/componentlibrary/src/components/ProfileModal/types';
import { Role } from '@workspaceui/etendohookbinder/src/api/types';
import { Option } from '@workspaceui/componentlibrary/src/components/Input/Select/types';

export interface WrapperHandledProps {
  currentRole: Role | null;
  currentWarehouse: BaseWarehouse | null;
  roles: Role[];
  onChangeRole: (roleId: string) => Promise<void>;
  onChangeWarehouse: (warehouseId: string) => Promise<void>;
  onSetDefaultConfiguration: (config: BaseDefaultConfiguration) => Promise<void>;
  logger: Logger;
  onRoleChange: (event: React.SyntheticEvent<Element, Event>, value: Option | null) => void;
  onWarehouseChange: (event: React.SyntheticEvent<Element, Event>, value: Option | null) => void;
  selectedRole: Option | null;
  selectedWarehouse: Option | null;
  saveAsDefault: boolean;
  onSaveAsDefaultChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface ProfileWrapperProps extends BaseProfileModalProps {}
