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

import { List } from "@mui/material";
import NotificationItem from "../NotificationItem";
import type { NotificationItemStatesProps } from "./types";

const NotificationItemStates: React.FC<NotificationItemStatesProps> = ({ notifications = [], type }) => {
  const filteredNotifications = notifications.filter((notification) => notification.type === type);
  return (
    <List>
      {filteredNotifications.map((notification) => (
        <NotificationItem
          key={notification.data.id}
          description={notification.data.description}
          priority={notification.data.priority}
          date={notification.data.date}
          icon={notification.data.icon}
          tagType={notification.data.tagType}
          ctaButtons={notification.data.ctaButtons}
        />
      ))}
    </List>
  );
};

export default NotificationItemStates;
