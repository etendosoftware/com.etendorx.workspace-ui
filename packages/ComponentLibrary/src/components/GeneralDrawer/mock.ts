import { Home, Info, Build, ContactMail } from '@mui/icons-material';

const sectionGroup1 = {
  id: 1,
  sections: [
    { label: 'Home', icon: Home, id: 1 },
    { label: 'About', icon: Info, id: 2 },
  ],
};

const sectionGroup2 = {
  id: 2,
  sections: [
    { label: 'Services', icon: Build, id: 3 },
    { label: 'Contact', icon: ContactMail, id: 4 },
  ],
};

export const sectionGroups = [sectionGroup1, sectionGroup2];
