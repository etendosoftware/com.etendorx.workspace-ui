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
  icon: <InfoIcon fill={defaultColor} />,
};

export const yesNoConfig = {
  Y: {
    type: "success" as TagType,
    icon: <CheckIcon fill={defaultColor} />,
  },
  N: {
    type: "error" as TagType,
    icon: <ErrorIcon fill={defaultColor} />,
  },
};

export const IDENTIFIER_KEY = "_identifier";
