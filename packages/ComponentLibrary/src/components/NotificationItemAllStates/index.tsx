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
