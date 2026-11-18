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

import Tooltip from "@workspaceui/componentlibrary/src/components/Tooltip";
import AlertCircleIcon from "@workspaceui/componentlibrary/src/assets/icons/alert-circle.svg";
import { useServerFieldError } from "@/stores/serverFieldErrorsStore";

interface ServerFieldErrorOverlayProps {
  scope: string;
  fieldName: string;
}

/**
 * Marks a field the server rejected on save, like Classic's error icon: a red border around
 * the input and an error icon whose tooltip holds the server message. It must be placed inside
 * a positioned container. The border ignores pointer events and the icon is not focusable, so
 * the field keeps its clicks and stays a single tab stop.
 */
export const ServerFieldErrorOverlay = ({ scope, fieldName }: ServerFieldErrorOverlayProps) => {
  const message = useServerFieldError(scope, fieldName);
  if (!message) {
    return null;
  }
  return (
    <>
      <span aria-hidden="true" className="server-field-error-overlay" data-testid="server-field-error-border" />
      <Tooltip title={message} position="top" multiline containerClassName="server-field-error-icon">
        <span role="img" aria-label={message} data-testid="server-field-error-icon">
          <AlertCircleIcon className="h-4 w-4 fill-(--color-error-main)" />
        </span>
      </Tooltip>
    </>
  );
};

export default ServerFieldErrorOverlay;
