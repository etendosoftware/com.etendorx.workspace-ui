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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type {
  FormPersonalizationPermissions,
  SaveFormPersonalizationParams,
  StoredFormPersonalization,
} from "@workspaceui/api-client/src/api/formPersonalization";
import { useCallback, useEffect, useMemo } from "react";
import {
  type FormPersonalizationStatus,
  formPersonalizationKey,
  useFormPersonalizationStore,
} from "@/stores/formPersonalizationStore";
import { useUserStore } from "@/stores/userStore";

interface UseFormPersonalizationReturn {
  status: FormPersonalizationStatus | "idle";
  /** The personalization that applies to the session for the tab, or null for the dictionary's layout. */
  personalization: StoredFormPersonalization | null;
  /** The levels the session may save at; only the user level until the personalization is loaded. */
  permissions: FormPersonalizationPermissions;
  save: (params: Omit<SaveFormPersonalizationParams, "tabId">) => Promise<void>;
  /** Discards the personalization that applies, if the session may. */
  discard: () => Promise<void>;
}

const USER_ONLY: FormPersonalizationPermissions = { scopes: ["USER"], roles: [], organizations: [] };

/**
 * The form personalization of a tab for the current session, loaded once per role, organization and
 * tab and shared by everything that shows or edits the form.
 *
 * @param tabId the tab, or undefined while it is not known (nothing is loaded then)
 */
export function useFormPersonalization(tabId: string | undefined): UseFormPersonalizationReturn {
  const roleId = useUserStore((s) => s.currentRole?.id);
  const orgId = useUserStore((s) => s.currentOrganization?.id ?? "");
  const token = useUserStore((s) => s.token);

  const key = tabId && roleId ? formPersonalizationKey(roleId, orgId, tabId) : undefined;
  const entry = useFormPersonalizationStore((s) => (key ? s.entries[key] : undefined));
  const load = useFormPersonalizationStore((s) => s.load);
  const storeSave = useFormPersonalizationStore((s) => s.save);
  const storeRemove = useFormPersonalizationStore((s) => s.remove);

  useEffect(() => {
    if (key && tabId && token) {
      void load(key, tabId);
    }
  }, [key, tabId, token, load]);

  const personalization = entry?.state?.personalization ?? null;

  const save = useCallback(
    async (params: Omit<SaveFormPersonalizationParams, "tabId">) => {
      if (key && tabId) {
        await storeSave(key, { ...params, tabId });
      }
    },
    [key, tabId, storeSave]
  );

  const discard = useCallback(async () => {
    if (key && tabId && personalization) {
      await storeRemove(key, tabId, personalization.id);
    }
  }, [key, tabId, personalization, storeRemove]);

  return useMemo(
    () => ({
      status: entry?.status ?? "idle",
      personalization,
      permissions: entry?.state?.permissions ?? USER_ONLY,
      save,
      discard,
    }),
    [entry, personalization, save, discard]
  );
}

export default useFormPersonalization;
