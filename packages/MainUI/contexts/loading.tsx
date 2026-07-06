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

import { useLoadingStore } from "@/stores/loadingStore";

// Re-export for backward compatibility during migration.
// New code should import directly from @/stores/loadingStore.
export const useLoading = () => ({
  isLoading: useLoadingStore((s) => s.isLoading),
  showLoading: useLoadingStore((s) => s.showLoading),
  hideLoading: useLoadingStore((s) => s.hideLoading),
});

// LoadingProvider is now a no-op wrapper — Zustand does not need providers.
// Kept here so layout.tsx does not require changes in this phase.
export default function LoadingProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
