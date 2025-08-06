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

import CheckIcon from "../../assets/icons/check.svg";
import ErrorIcon from "../../assets/icons/x-octagon.svg";
import WarningIcon from "../../assets/icons/alert-triangle.svg";
import type { StatusConfig, StatusType } from "./types";
import { theme } from "../../theme";

export const statusConfig: Record<StatusType, StatusConfig> = {
  success: {
    gradientColor: "#BFFFBF",
    iconBackgroundColor: theme.palette.success.main,
    icon: CheckIcon,
  },
  error: {
    gradientColor: "#FFCCD6",
    iconBackgroundColor: theme.palette.error.main,
    icon: ErrorIcon,
  },
  warning: {
    gradientColor: theme.palette.warning.light,
    iconBackgroundColor: theme.palette.warning.main,
    icon: WarningIcon,
  },
  info: {
    gradientColor: theme.palette.warning.light,
    iconBackgroundColor: theme.palette.warning.main,
    icon: WarningIcon,
  },
};
