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

import { useCalloutHighlightToken } from "@/stores/calloutHighlightStore";

interface CalloutHighlightOverlayProps {
  scope: string;
  fieldName: string;
}

/**
 * Brief tint over a field a callout just changed. It must be placed inside a positioned
 * container; it ignores pointer events, so it never takes the focus or a click from the field.
 * Keyed by the callout token so a new change restarts the fade animation.
 */
export const CalloutHighlightOverlay = ({ scope, fieldName }: CalloutHighlightOverlayProps) => {
  const token = useCalloutHighlightToken(scope, fieldName);
  if (token === undefined) {
    return null;
  }
  return <span key={token} aria-hidden="true" className="callout-highlight-overlay" data-testid="callout-highlight" />;
};

export default CalloutHighlightOverlay;
