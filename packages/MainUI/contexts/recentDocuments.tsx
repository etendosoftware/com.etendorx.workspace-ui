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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

"use client";

import type React from "react";
import { useEffect } from "react";
import { useRecentDocumentsStore } from "@/stores/recentDocumentsStore";
import { useUserStore } from "@/stores/userStore";

/**
 * Triggers a role-scoped re-fetch of recent documents whenever the current role changes.
 * State lives in Zustand — this provider only handles the role-change side-effect.
 */
export function RecentDocumentsProvider({ children }: { children: React.ReactNode }) {
  const currentRole = useUserStore((s) => s.currentRole);
  const roleId = currentRole?.id;

  // biome-ignore lint/correctness/useExhaustiveDependencies: roleId is a hook-derived value, not a static outer-scope reference
  useEffect(() => {
    useRecentDocumentsStore.getState().resetForRole();
    useRecentDocumentsStore.getState().fetchForRole();
  }, [roleId]);

  return <>{children}</>;
}

/**
 * Backward-compatible hook — mirrors the previous `useRecentDocuments` shape so call
 * sites (e.g. FormView's write-back effect) don't need to change.
 */
export function useRecentDocumentsContext() {
  const documents = useRecentDocumentsStore((s) => s.documents);
  const track = useRecentDocumentsStore((s) => s.track);

  return { documents, addRecentDocument: track };
}
