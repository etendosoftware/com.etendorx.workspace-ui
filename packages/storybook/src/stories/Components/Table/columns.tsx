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

import type { MRT_ColumnDef } from 'material-react-table';
import type { Organization, OrganizationLabels } from './types';

export const getColumns = (labels: Partial<OrganizationLabels> = {}): MRT_ColumnDef<Organization>[] => [
  {
    accessorKey: 'organization',
    header: labels.organization ?? 'Organization',
  },
  {
    accessorKey: 'transactionDocument',
    header: labels.transactionDocument ?? 'Transaction Document',
  },
  {
    accessorKey: 'documentNo',
    header: labels.documentNo ?? 'Document No.',
  },
  {
    accessorKey: 'orderDate',
    header: labels.orderDate ?? 'Order Date',
  },
  {
    accessorKey: 'businessPartner',
    header: labels.businessPartner ?? 'Business Partner',
  },
  {
    accessorKey: 'partnerAddress',
    header: labels.partnerAddress ?? 'Partner Address',
  },
  {
    accessorKey: 'priceList',
    header: labels.priceList ?? 'Price List',
  },
  {
    accessorKey: 'scheduledDeliveryDate',
    header: labels.scheduledDeliveryDate ?? 'Scheduled Delivery Date',
  },
  {
    accessorKey: 'paymentMethod',
    header: labels.paymentMethod ?? 'Payment Method',
  },
  {
    accessorKey: 'paymentTerms',
    header: labels.paymentTerms ?? 'Payment Terms',
  },
  {
    accessorKey: 'warehouse',
    header: labels.warehouse ?? 'Warehouse',
  },
  {
    accessorKey: 'invoiceTerms',
    header: labels.invoiceTerms ?? 'Invoice Terms',
  },
  {
    accessorKey: 'orderReference',
    header: labels.orderReference ?? 'Order Reference',
  },
  {
    accessorKey: 'salesRepresentative',
    header: labels.salesRepresentative ?? 'Sales Representative',
  },
  {
    accessorKey: 'description',
    header: labels.description ?? 'Description',
  },
  {
    accessorKey: 'invoiceAddress',
    header: labels.invoiceAddress ?? 'Invoice Address',
  },
  {
    accessorKey: 'deliveryLocation',
    header: labels.deliveryLocation ?? 'Delivery Location',
  },
  {
    accessorKey: 'quotation',
    header: labels.quotation ?? 'Quotation',
  },
  {
    accessorKey: 'cancelledorder',
    header: labels.cancelledorder ?? 'Cancelled Order',
  },
  {
    accessorKey: 'replacedorder',
    header: labels.replacedorder ?? 'Replaced Order',
  },
  {
    accessorKey: 'iscancelled',
    header: labels.iscancelled ?? 'Is Cancelled',
    Cell: ({ cell }) => (cell.getValue<boolean>() ? 'Yes' : 'No'),
  },
  {
    accessorKey: 'externalBusinessPartnerReference',
    header: labels.externalBusinessPartnerReference ?? 'External Business Partner Reference',
  },
  {
    accessorKey: 'project',
    header: labels.project ?? 'Project',
  },
  {
    accessorKey: 'costcenter',
    header: labels.costcenter ?? 'Cost Center',
  },
  {
    accessorKey: 'asset',
    header: labels.asset ?? 'Asset',
  },
  {
    accessorKey: 'stDimension',
    header: labels.stDimension ?? '1st Dimension',
  },
  {
    accessorKey: 'ndDimension',
    header: labels.ndDimension ?? '2nd Dimension',
  },
  {
    accessorKey: 'creationDate',
    header: labels.creationDate ?? 'Creation Date',
  },
  {
    accessorKey: 'createdBy',
    header: labels.createdBy ?? 'Created By',
  },
  {
    accessorKey: 'updated',
    header: labels.updated ?? 'Updated',
  },
  {
    accessorKey: 'updatedBy',
    header: labels.updatedBy ?? 'Updated By',
  },
  {
    accessorKey: 'documentStatus',
    header: labels.documentStatus ?? 'Document Status',
  },
  {
    accessorKey: 'grandTotalAmount',
    header: labels.grandTotalAmount ?? 'Grand Total Amount',
  },
  {
    accessorKey: 'summedLineAmount',
    header: labels.summedLineAmount ?? 'Summed Line Amount',
  },
  {
    accessorKey: 'currency',
    header: labels.currency ?? 'Currency',
  },
  {
    accessorKey: 'reservationStatus',
    header: labels.reservationStatus ?? 'Reservation Status',
  },
  {
    accessorKey: 'deliveryStatus',
    header: labels.deliveryStatus ?? 'Delivery Status',
  },
  {
    accessorKey: 'invoiceStatus',
    header: labels.invoiceStatus ?? 'Invoice Status',
  },
  {
    accessorKey: 'delivered',
    header: labels.delivered ?? 'Delivered',
    Cell: ({ cell }) => (cell.getValue<boolean>() ? 'Yes' : 'No'),
  },
  {
    accessorKey: 'id',
    header: labels.id ?? 'ID',
  },
];
