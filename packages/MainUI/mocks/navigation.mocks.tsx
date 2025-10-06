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

import type { Inotifications } from "@workspaceui/componentlibrary/src/commons";
import {
  Description,
  LightbulbCircle,
  CloudDownloadOutlined,
  WarningAmberOutlined,
  Person,
  AutoAwesome,
  NoteAltOutlined,
  FileDownloadOutlined,
} from "@mui/icons-material";
import { theme } from "@workspaceui/componentlibrary/src/theme";
import ProfileIcon from "@workspaceui/componentlibrary/src/assets/icons/profile.svg";
import LockIcon from "@workspaceui/componentlibrary/src/assets/icons/lock.svg";
import type { Section } from "../components/ProfileModal/ToggleButton/types";

const buttonStyles = {
  leftButton: {
    background: theme.palette.baselineColor.transparentNeutral[10],
    color: theme.palette.baselineColor.transparentNeutral[70],
    height: "2rem",
    borderRadius: "6.25rem",
    padding: "0.5rem 1rem",
    border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
    "&:hover": {
      border: "1px solid transparent",
      background: theme.palette.dynamicColor.main,
      color: theme.palette.baselineColor.neutral[10],
    },
  },
  rightButton: {
    background: theme.palette.baselineColor.neutral[100],
    color: theme.palette.baselineColor.neutral[0],
    height: "2rem",
    borderRadius: "6.25rem",
    padding: "0.5rem 1rem",
    "&:hover": {
      background: theme.palette.dynamicColor.main,
      color: theme.palette.baselineColor.neutral[10],
    },
  },
};

export const createNotifications = (): Inotifications[] => [
  {
    id: "1",
    description: "The costs have been calculated for July 30, 2024.",
    priority: "High",
    date: "1m ago",
    icon: Description,
  },
  {
    id: "2",
    description:
      "Copilot recommends purchasing [📦 Long Fine Cruise Rice 1 K](https://example.com) as it is running out of stock.",
    priority: "Medium",
    date: "1m ago",
    icon: LightbulbCircle,
    ctaButtons: [
      {
        key: "retry",
        label: "do it myself",
        action: () => console.log("Retry clicked"),
        sx: buttonStyles.leftButton,
      },
      {
        key: "contact-support",
        label: "Copilot is in charge",
        action: () => console.log("Contact Support clicked"),
        icon: AutoAwesome,
        sx: buttonStyles.rightButton,
      },
    ],
  },
  {
    id: "3",
    description: "A new version of Etendo has come out; it **is necessary to update** the system.",
    priority: "medium priority",
    date: "2023-01-03",
    tagType: "warning",
    icon: CloudDownloadOutlined,
    ctaButtons: [
      {
        key: "view-details",
        label: "Release note",
        action: () => console.log("View Details clicked"),
        icon: NoteAltOutlined,
        sx: buttonStyles.leftButton,
      },
      {
        key: "update",
        label: "Update",
        action: () => console.log("Dismiss clicked"),
        icon: FileDownloadOutlined,
        sx: buttonStyles.rightButton,
      },
    ],
  },
  {
    id: "4",
    description: "There was an **error** in database",
    priority: "High Priority",
    date: "2023-01-04",
    tagType: "error",
    icon: WarningAmberOutlined,
  },
  {
    id: "5",
    description: "[Alexandra Asto](https://example.com) te menciono [💳 946240](https://example.com)",
    priority: "Draft",
    date: "2023-01-05",
    tagType: "draft",
    icon: Person,
  },
];

export const NOTIFICATIONS = createNotifications();

export const menuItems = [
  { emoji: "💼", label: "New Job", key: "newJob" },
  { emoji: "💳", label: "New Sales Order", key: "newSalesOrder" },
  { emoji: "💳", label: "New Sales Invoice", key: "newInvoice" },
  { emoji: "📦", label: "New Product", key: "newProduct" },
  { emoji: "📊", label: "New Accounting Sheet", key: "newAccountingSheet" },
];

const defaultFill = "#6B7280";

export const sections: Section[] = [
  {
    id: "profile",
    label: "Perfil",
    icon: <ProfileIcon fill={defaultFill} data-testid="ProfileIcon__ea192c" />,
  },
  {
    id: "password",
    label: "Contraseña",
    icon: <LockIcon fill={defaultFill} data-testid="LockIcon__ea192c" />,
  },
];
