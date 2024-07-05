import React from 'react';
import { Typography, Box } from '@mui/material';
import { AppsOutlined, ShoppingCartOutlined, Inventory2Outlined, PersonOutlineOutlined, WidgetsOutlined, StorefrontOutlined } from "@mui/icons-material";
import SearchModal from '../../../../../ComponentLibrary/src/components/SearchModal';

export default {
  title: 'Components/SearchModal',
  component: SearchModal,
};

const TABS_CONFIG = [
  {
    icon: <AppsOutlined />,
    label: "Todo",
    onClick: () => console.log("Navigating to Todo"),
    items: []
  },
  {
    icon: <AppsOutlined />,
    label: "Aplicaciones",
    onClick: () => console.log("Navigating to Aplicaciones"),
    items: [
      { name: "Pedido de venta", icon: '💳' },
      { name: "Pedido de venta por albaranes", icon: '💳' },
    ],
  },
  {
    icon: <ShoppingCartOutlined />,
    label: "Pedidos de venta",
    onClick: () => console.log("Navigating to Pedidos de venta"),
    items: [
      { name: "192456 Pedido de venta", icon: '📄', isNew: true, newLabel: 'Nuevo' },
      { name: "pedido de venta de isa", icon: '📄' },
      { name: "1219 pedido de venta argentina", icon: '📄' },
    ],
  },
  {
    icon: <Inventory2Outlined />,
    label: "Productos",
    numberOfItems: 2,
    onClick: () => console.log("Navigating to Productos"),
    items: [
      { name: "Esmalte Semipermanente 8ml Pedido de venta #192", icon: '📦' },
      { name: "Dermaroller pedido de ventas de Julian de 192 agujas", icon: '📦' },
    ]
  },
  {
    icon: <PersonOutlineOutlined />,
    label: "Terceros",
    numberOfItems: 1,
    onClick: () => console.log("Navigating to Terceros"),
    items: [
      { name: "Aliwin Pedido de venta IS192 SL", icon: '👤' },
    ]
  },
];

const searchData = [
  {
    title: "Aplicaciones",
    items: [
      { name: "MRP", icon: '✅' },
      { name: "Proyectos y servicios", icon: '📦' }
    ]
  },
  {
    title: "Otros",
    items: [
      { name: "Esmalte Semipermanente 8ml Pedido de vent...", icon: '💅' },
      { name: "Dermaroller pedido de ventas de Julian de 19...", icon: '📦' }
    ]
  }
];

// Template para la variante 'default'
export const DefaultVariant = () => (
  <SearchModal tabsConfig={TABS_CONFIG} searchData={searchData} variant='default' />
);

// Template para la variante 'tabs'
export const TabsVariant = () => (
  <SearchModal tabsConfig={TABS_CONFIG} searchData={searchData} variant='tabs' />
);

// Si quieres mostrar ambas variantes juntas en una sola historia
export const BothVariants = () => (
  <Box sx={{ display: 'flex', gap: '20px' }}>
    <Box>
      <Typography variant="h6" gutterBottom>Default Variant</Typography>
      <SearchModal tabsConfig={TABS_CONFIG} searchData={searchData} variant='default' />
    </Box>
    <Box>
      <Typography variant="h6" gutterBottom>Tabs Variant</Typography>
      <SearchModal tabsConfig={TABS_CONFIG} searchData={searchData} variant='tabs' />
    </Box>
  </Box>
);
