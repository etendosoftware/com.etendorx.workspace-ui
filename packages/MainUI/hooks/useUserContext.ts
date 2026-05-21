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

import { useContext } from "react";
import { UserContext } from "../contexts/user";

/**
 * Backward-compatible hook for accessing the full user context.
 *
 * State fields are sourced from the Zustand UserStore (via UserProvider
 * subscriptions), so all values are reactive and always up-to-date.
 *
 * For performance-critical components, prefer importing selectors directly
 * from `@/stores/userStore` to subscribe only to the slice you need:
 *
 * ```tsx
 * // Only re-renders when token changes
 * const token = useUserStore((s) => s.token);
 *
 * // Multiple fields — use useShallow
 * import { useShallow } from "zustand/react/shallow";
 * const { token, currentRole } = useUserStore(
 *   useShallow((s) => ({ token: s.token, currentRole: s.currentRole }))
 * );
 * ```
 */
export const useUserContext = () => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }

  return context;
};
