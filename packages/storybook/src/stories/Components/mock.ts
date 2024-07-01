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
  { id: '1', label: 'Work', isActive: true },
  { id: '2', label: 'Sales Order', isActive: false },
  { id: '3', label: 'Sales Invoice', isActive: true },
  { id: '4', label: 'Product', isActive: false },
  { id: '5', label: 'Third-Party Invoice Paid', isActive: false },
  { id: '6', label: 'Third-Party Credit Memo', isActive: true },
];
