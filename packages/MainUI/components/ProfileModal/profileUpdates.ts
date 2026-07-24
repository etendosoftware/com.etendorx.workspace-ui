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

import type { Option } from "@workspaceui/componentlibrary/src/components/Input/Select/types";
import type { CurrentOrganization, CurrentRole, CurrentWarehouse } from "@workspaceui/api-client/src/api/types";

export interface ProfileChangeParams {
  role?: string;
  organization?: string;
  warehouse?: string;
}

export interface ComputeProfileUpdatesArgs {
  selectedRole: Option | null;
  selectedOrg: Option | null;
  selectedWarehouse: Option | null;
  currentRole: CurrentRole | undefined;
  currentOrganization: CurrentOrganization | undefined;
  currentWarehouse: CurrentWarehouse | undefined;
}

/**
 * Builds the payload for a profile switch, mirroring the Classic UI widget
 * (ob-user-profile-widget.js), which always posts the explicitly displayed
 * role + organization + warehouse.
 *
 * This is the crux of ETP-4370. The backend `/sws/login` only recomputes
 * organization/warehouse when they are ABSENT from the request — and when they
 * are absent it backfills them from the PREVIOUS token's claims, not from the
 * role's default. So sending only `{ role }` makes the backend silently carry
 * over the stale org/warehouse from the last profile (e.g. it keeps "Sur" while
 * the modal shows "Norte"), and any "save as default" then persists that
 * mismatch into AD_User, corrupting the user's defaults over time.
 *
 * By sending the org/warehouse currently shown whenever anything changed, the
 * activated profile always equals what the user sees and what gets persisted as
 * the default — exactly as Classic behaves.
 */
export function computeProfileUpdates({
  selectedRole,
  selectedOrg,
  selectedWarehouse,
  currentRole,
  currentOrganization,
  currentWarehouse,
}: ComputeProfileUpdatesArgs): ProfileChangeParams {
  const roleChanged = !!selectedRole && selectedRole.value !== currentRole?.id;
  const orgChanged = !!selectedOrg && selectedOrg.value !== currentOrganization?.id;
  const warehouseChanged = !!selectedWarehouse && selectedWarehouse.value !== currentWarehouse?.id;

  if (!roleChanged && !orgChanged && !warehouseChanged) {
    return {};
  }

  const params: ProfileChangeParams = {};

  if (selectedRole) {
    params.role = selectedRole.value;
  }
  if (selectedOrg) {
    params.organization = selectedOrg.value;
  }
  if (selectedWarehouse) {
    params.warehouse = selectedWarehouse.value;
  }

  return params;
}
