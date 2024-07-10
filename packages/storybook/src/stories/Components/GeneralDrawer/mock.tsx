import { Home, Info, Build, ContactMail } from '@mui/icons-material';

export const sectionGroups = [
  {
    id: 1,
    sections: [
      { label: 'Home', icon: <Home />, id: 1 },
      { label: 'About', icon: <Info />, id: 2 },
    ],
  },
  {
    id: 2,
    sections: [
      { label: 'Services', icon: <Build />, id: 3 },
      { label: 'Contact', icon: <ContactMail />, id: 4 },
    ],
  },
];
