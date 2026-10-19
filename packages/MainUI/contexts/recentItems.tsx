/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance
 * with the License.
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

"use client";

import type React from "react";
import { useEffect } from "react";
import { useRecentItemsStore } from "@/stores/recentItemsStore";
import { useUserStore } from "@/stores/userStore";
import { buildRecentItemsScopeKey } from "@/utils/recentItems";

/**
 * Loads the server-side recent items whenever the user, role or organization changes.
 * State lives in Zustand — this provider only handles the scope-change side-effect.
 */
export function RecentItemsProvider({ children }: { children: React.ReactNode }) {
  const userId = useUserStore((s) => s.user?.id);
  const roleId = useUserStore((s) => s.currentRole?.id);
  const orgId = useUserStore((s) => s.currentOrganization?.id);
  const scopeKey = buildRecentItemsScopeKey(userId, roleId, orgId);

  useEffect(() => {
    useRecentItemsStore.getState().loadForScope(scopeKey);
  }, [scopeKey]);

  return <>{children}</>;
}
