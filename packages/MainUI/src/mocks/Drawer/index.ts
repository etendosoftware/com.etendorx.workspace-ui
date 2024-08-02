import type {
  Section,
  SectionGroup,
} from '../../../../ComponentLibrary/src/components/Drawer/types';

export const mainSections: Section[] = [
  { id: '3', label: 'Buscar aplicación', icon: '🔍' },
  {
    id: '4',
    label: 'Configuración general',
    icon: '⚙️',
    subSections: [
      { id: '131', label: 'Albarán (Cliente)', icon: '📄' },
      {
        id: '132',
        label: 'Devolución de cliente',
        icon: '↩️',
        subSections: [
          {
            id: '1321',
            label: 'Devolución parcial',
            icon: undefined,
          },
          {
            id: '1322',
            label: 'Devolución total',
            icon: undefined,
          },
        ],
      },
    ],
  },
  { id: '5', label: 'Jobs', icon: '💼', badge: 'Nuevo' },
  { id: '6', label: 'Datos Maestros', icon: '📁' },
  { id: '7', label: 'Compras', icon: '🛒', badge: '12' },
  { id: '8', label: 'Almacén', icon: '🏭' },
  { id: '9', label: 'Etendo RX', icon: '🧬', badge: '1' },
  { id: '10', label: 'Intrastat', icon: '📊' },
  { id: '11', label: 'Producción', icon: '🏗️' },
  { id: '12', label: 'MRP', icon: '✅' },
  {
    id: '13',
    label: 'Ventas',
    icon: '💰',
    subSections: [
      { id: '141', label: 'Albarán (Cliente)', icon: '📄' },
      {
        id: '142',
        label: 'Devolución de cliente',
        icon: '↩️',
        subSections: [
          {
            id: '1323',
            label: 'Devolución parcial',
            icon: undefined,
          },
          {
            id: '1324',
            label: 'Devolución total',
            icon: undefined,
          },
        ],
      },
    ],
  },
  { id: '14', label: 'Proyectos y servicios', icon: '📈' },
  { id: '15', label: 'Finanzas', icon: '🏦', badge: '+99' },
];

export const sectionGroups: SectionGroup[] = [
  {
    id: '1',
    sections: mainSections,
  },
];
