import { Person } from '../../../../ComponentLibrary/src/components/DragModal/DragModal.types';

export const menuItems = [
  { emoji: '💼', label: 'New Job', key: 'newJob' },
  { emoji: '💳', label: 'New Sales Order', key: 'newSalesOrder' },
  { emoji: '💳', label: 'New Sales Invoice', key: 'newInvoice' },
  { emoji: '📦', label: 'New Product', key: 'newProduct' },
  { emoji: '📊', label: 'New Accounting Sheet', key: 'newAccountingSheet' },
  { emoji: '📝', label: 'Customize', key: 'customize' },
];

export const initialPeople: Person[] = [
  { id: '1', label: 'Trabajo', isActive: true },
  { id: '2', label: 'Pedido de venta', isActive: false },
  { id: '3', label: 'Factura de venta', isActive: true },
  { id: '4', label: 'Producto', isActive: false },
  { id: '5', label: 'Factura de tercero pagada', isActive: false },
  { id: '6', label: 'Comprobante de tercero para devolución', isActive: true },
];
