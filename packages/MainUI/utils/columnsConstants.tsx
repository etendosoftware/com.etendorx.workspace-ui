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

import type { TagType } from "@workspaceui/componentlibrary/src/components/Tag/types";
import InfoIcon from "../../ComponentLibrary/src/assets/icons/info.svg";
import CheckIcon from "../../ComponentLibrary/src/assets/icons/check-circle.svg";
import ErrorIcon from "../../ComponentLibrary/src/assets/icons/alert-octagon.svg";

const defaultColor = "var(--color-baseline-0)";

export const statusConfig: Record<string, { type: TagType; icon?: React.ReactElement }> = {
  AP: { type: "success" }, // Accepted
  CL: { type: "success" }, // Closed
  CO: { type: "success" }, // Booked
  PO: { type: "success" }, // Posted
  CA: { type: "success" }, // Closed - Order Created

  IP: { type: "warning" }, // Under Way
  CH: { type: "warning" }, // Modified
  PR: { type: "warning" }, // Printed
  XX: { type: "warning" }, // Procesando
  UE: { type: "warning" }, // Under Evaluation
  ME: { type: "warning" }, // Manual Evaluation
  AE: { type: "warning" }, // Automatic Evaluation

  NA: { type: "error" }, // Not Accepted
  VO: { type: "error" }, // Voided
  PE: { type: "error" }, // Accounting Error
  TE: { type: "error" }, // Transfer Error
  IN: { type: "error" }, // Inactive
  CJ: { type: "error" }, // Closed - Rejected
  NC: { type: "error" }, // Not Confirmed
  WP: { type: "error" }, // Not Paid

  TR: { type: "primary" }, // Transferred
  RE: { type: "primary" }, // Re-Opened

  DR: { type: "draft" }, // Draft
  TMP: { type: "draft" }, // Temporal
  "??": { type: "draft" }, // Unknown
};

export const DEFAULT_STATUS_CONFIG = {
  type: "draft" as TagType,
  icon: <InfoIcon fill={defaultColor} data-testid="InfoIcon__f961ca" />,
};

export const yesNoConfig = {
  Y: {
    type: "success" as TagType,
    icon: <CheckIcon fill={defaultColor} data-testid="CheckIcon__f961ca" />,
  },
  N: {
    type: "error" as TagType,
    icon: <ErrorIcon fill={defaultColor} data-testid="ErrorIcon__f961ca" />,
  },
};

export const IDENTIFIER_KEY = "_identifier";
