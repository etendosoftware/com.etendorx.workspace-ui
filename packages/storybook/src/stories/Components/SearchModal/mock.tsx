import { AppsOutlined, ShoppingCartOutlined, Inventory2Outlined, PersonOutlineOutlined, LayersOutlined } from "@mui/icons-material";

export const TABS_CONTENT = [
  {
    icon: <LayersOutlined />,
    label: "Todo",
    onClick: () => console.log("Navigating to Todo"),
    items: [],
    numberOfItems: 8,
  },
  {
    icon: <AppsOutlined />,
    label: "Aplicaciones",
    onClick: () => console.log("Navigating to Aplicaciones"),
    items: [
      { name: "Pedido de venta", icon: '💳' },
      { name: "Pedido de venta por albaranes", icon: '💳' },
    ],
    numberOfItems: 2,
  },
  {
    icon: <ShoppingCartOutlined />,
    label: "Pedidos de venta",
    onClick: () => console.log("Navigating to Pedidos de venta"),
    items: [
      { name: "192456 Pedido de venta", icon: '💳', isNew: true, newLabel: 'Nuevo' },
      { name: "pedido de venta de isa", icon: '💳' },
      { name: "1219 pedido de venta argentina", icon: '💳' },
    ],
    numberOfItems: 3,
  },
  {
    icon: <Inventory2Outlined />,
    label: "Productos",
    onClick: () => console.log("Navigating to Productos"),
    items: [
      { name: "Esmalte Semipermanente 8ml Pedido de venta #192", icon: '📦' },
      { name: "Dermaroller pedido de ventas de Julian de 192 agujas", icon: '📦' },
    ],
    numberOfItems: 2,
  },
  {
    icon: <PersonOutlineOutlined />,
    label: "Terceros",
    onClick: () => console.log("Navigating to Terceros"),
    items: [
      { name: "Aliwin Pedido de venta IS192 SL", icon: '👤' },
    ],
    numberOfItems: 1,
  },
];

export const DEFAULT_CONTENT = {
  headerTitle: "Búsquedas recientes",
  sections: [
    {
      title: "Aplicaciones",
      items: [
        { name: "MRP", icon: '✅' },
        { name: "Proyectos y servicios", icon: '📊' }
      ]
    },
    {
      title: "Otros",
      items: [
        { name: "Esmalte Semipermanente 8ml Pedido de vent...", icon: '📦' },
        { name: "Dermaroller pedido de ventas de Julian de 19...", icon: '📦' }
      ]
    }
  ]
};
