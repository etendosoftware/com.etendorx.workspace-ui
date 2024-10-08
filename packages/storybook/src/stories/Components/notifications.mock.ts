import { Inotifications } from '../../../../ComponentLibrary/src/commons';
import {
  Description,
  LightbulbCircle,
  CloudDownloadOutlined,
  WarningAmberOutlined,
  Person,
  AutoAwesome,
  NoteAltOutlined,
  FileDownloadOutlined,
} from '@mui/icons-material';
import { sx } from '../../../../ComponentLibrary/src/components/NotificationItem/styles';

export const NOTIFICATIONS: Inotifications[] = [
  {
    id: '1',
    description: 'The costs have been calculated for July 30, 2024.',
    priority: 'High',
    date: '1m ago',
    icon: Description,
  },
  {
    id: '2',
    description:
      'Copilot recommends purchasing [📦 Long Fine Cruise Rice 1 K](https://example.com) as it is running out of stock.',
    priority: 'Medium',
    date: '1m ago',
    icon: LightbulbCircle,
    ctaButtons: [
      {
        key: 'retry',
        label: 'do it myself',
        action: () => console.log('Retry clicked'),
        sx: sx.leftButton,
      },
      {
        key: 'contact-support',
        label: 'Copilot is in charge',
        action: () => console.log('Contact Support clicked'),
        icon: AutoAwesome,
        sx: sx.rightButton,
      },
    ],
  },
  {
    id: '3',
    description:
      'A new version of Etendo has come out; it **is necessary to update** the system.',
    priority: 'medium priority',
    date: '2023-01-03',
    tagType: 'warning',
    icon: CloudDownloadOutlined,
    ctaButtons: [
      {
        key: 'view-details',
        label: 'Release note',
        action: () => console.log('View Details clicked'),
        icon: NoteAltOutlined,
        sx: sx.leftButton,
      },
      {
        key: 'update',
        label: 'Update',
        action: () => console.log('Dismiss clicked'),
        icon: FileDownloadOutlined,
        sx: sx.rightButton,
      },
    ],
  },
  {
    id: '4',
    description: 'There was an **error** in database',
    priority: 'High Priority',
    date: '2023-01-04',
    tagType: 'error',
    icon: WarningAmberOutlined,
  },
  {
    id: '5',
    description:
      '[Alexandra Asto](https://example.com) te menciono [💳 946240](https://example.com)',
    priority: 'Draft',
    date: '2023-01-05',
    tagType: 'draft',
    icon: Person,
  },
];
