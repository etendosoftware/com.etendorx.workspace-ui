/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { Role } from "@workspaceui/api-client/src/api/types";
import type { Option } from "@workspaceui/componentlibrary/src/components/Input/Select/types";
import type { BaseDefaultConfiguration, BaseProfileModalProps, BaseWarehouse } from "../ProfileModal/types";
import type { Logger } from "@/utils/logger";

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

export interface ProfileWrapperProps extends Omit<BaseProfileModalProps, "userPhotoUrl" | "userName" | "userEmail"> {}
