/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { Item } from '@workspaceui/componentlibrary/src/components/DragModal/DragModal.types';

export const menuItems = [
  { emoji: '💼', label: 'New Job', key: 'newJob' },
  { emoji: '💳', label: 'New Sales Order', key: 'newSalesOrder' },
  { emoji: '💳', label: 'New Sales Invoice', key: 'newInvoice' },
  { emoji: '📦', label: 'New Product', key: 'newProduct' },
  { emoji: '📊', label: 'New Accounting Sheet', key: 'newAccountingSheet' },
];

export const initialPeople: Item[] = [
  { id: '1', label: 'Work', isActive: true },
  { id: '2', label: 'Sales Order', isActive: false },
  { id: '3', label: 'Sales Invoice', isActive: true },
  { id: '4', label: 'Product', isActive: false },
  { id: '5', label: 'Third-Party Invoice Paid', isActive: false },
  { id: '6', label: 'Third-Party Credit Memo', isActive: true },
];
