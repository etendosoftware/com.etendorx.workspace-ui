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

"use client";

import { useEffect } from "react";
import { useMetadataZustandStore } from "@/stores/metadataStore";
import type { MetadataStoreState } from "@/stores/metadataStore";
import { useUserStore } from "@/stores/userStore";

// Re-export for backward compatibility
export type IMetadataStoreContext = MetadataStoreState;

/**
 * Thin backward-compat provider.
 * Only responsibility: reset the Zustand store when the user's role changes.
 * State lives in the Zustand store — no React Context needed.
 */
export function MetadataStoreProvider({ children }: React.PropsWithChildren) {
  const currentRole = useUserStore((s) => s.currentRole);
  const resetForRole = useMetadataZustandStore((s) => s.resetForRole);

  // Reset store when role changes to avoid stale metadata in memory.
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset store when role changes to avoid stale metadata in memory.
  useEffect(() => {
    resetForRole();
  }, [currentRole?.id]);

  return <>{children}</>;
}

/**
 * Backward-compat hook — delegates entirely to the Zustand store.
 * Existing consumers import this; new code should use useMetadataZustandStore directly.
 */
export const useMetadataStore = (): IMetadataStoreContext => {
  return useMetadataZustandStore();
};
