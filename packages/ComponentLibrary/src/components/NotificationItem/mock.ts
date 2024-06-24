import { Inotifications } from '../../commons';
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
import { sx } from './styles';

export const NOTIFICATIONS: Inotifications[] = [
  {
    id: '1',
    description: 'Se ha calculado los costes para el 30 de Julio de 2024.',
    priority: 'High',
    date: '2023-01-01',
    tagType: 'success',
    icon: Description,
  },
  {
    id: '2',
    description:
      'Your order has been **shipped**. Track it [here](https://example.com).',
    priority: 'Medium',
    date: '2023-01-02',
    tagType: 'primary',
    icon: LightbulbCircle,
  },
  {
    id: '3',
    description: 'Your password has been **changed** successfully.',
    priority: 'Low',
    date: '2023-01-03',
    tagType: 'warning',
    icon: CloudDownloadOutlined,
    ctaButtons: [
      {
        key: 'view-details',
        label: 'Notas de la versión',
        action: () => console.log('View Details clicked'),
        icon: NoteAltOutlined,
        sx: sx.leftButton,
      },
      {
        key: 'update',
        label: 'Actualizar',
        action: () => console.log('Dismiss clicked'),
        icon: FileDownloadOutlined,
        sx: sx.rigthButton,
      },
    ],
  },
  {
    id: '4',
    description: 'There was an **error** processing your request. Try again',
    priority: 'Urgent',
    date: '2023-01-04',
    tagType: 'error',
    icon: WarningAmberOutlined,
    ctaButtons: [
      {
        key: 'retry',
        label: 'Hacerlo yo',
        action: () => console.log('Retry clicked'),
        sx: sx.leftButton,
      },
      {
        key: 'contact-support',
        label: 'Copilot se encarga',
        action: () => console.log('Contact Support clicked'),
        icon: AutoAwesome,
        sx: sx.rigthButton,
      },
    ],
  },
  {
    id: '5',
    description: 'Your draft has been **saved**.',
    priority: 'Draft',
    date: '2023-01-05',
    tagType: 'draft',
    icon: Person,
  },
];
