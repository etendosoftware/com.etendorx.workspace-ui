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

import { useEffect, useState } from "react";

/**
 * Latches the first expansion of a collapsible section for a given key.
 *
 * Returns true from the first time `isExpanded` is true for `resetKey`, and keeps
 * returning true after the section is collapsed again, so lazily loaded content is
 * not requested twice for the same key. When `resetKey` changes (e.g. a different
 * record is shown) the latch is released until the section is expanded again.
 *
 * @param isExpanded - Whether the section is currently expanded
 * @param resetKey - Identity the latch belongs to (e.g. the record id)
 * @returns True when the section has been expanded at least once for `resetKey`
 */
export function useExpandedOnce(isExpanded: boolean, resetKey: string): boolean {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded) {
      setExpandedKey(resetKey);
    }
  }, [isExpanded, resetKey]);

  return isExpanded || expandedKey === resetKey;
}

export default useExpandedOnce;
