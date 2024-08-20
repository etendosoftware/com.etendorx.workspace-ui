import { Organization } from './types';

export const mockOrganizations: Organization[] = [
  {
    _mainSection: {
      name: '_mainSection',
      label: 'Main Information',
      type: 'section',
      personalizable: false,
    },
    organization: {
      value: 'Global Enterprises',
      type: 'select',
      label: 'Organization',
      section: '_mainSection',
      required: true,
    },
    transactionDocument: {
      value: 'Sales Order',
      type: 'text',
      label: 'Transaction Document',
      section: '_mainSection',
      required: true,
    },
    documentNo: {
      value: 'SO-001',
      type: 'text',
      label: 'Document No.',
      section: '_mainSection',
      required: true,
    },
    orderDate: {
      value: '2023-08-15',
      type: 'date',
      label: 'Order Date',
      section: '_mainSection',
      required: true,
    },
    iscancelled: {
      value: false,
      type: 'boolean',
      label: 'Is Cancelled',
      section: '_mainSection',
      required: true,
    },
    businessPartner: {
      value: 'TechCorp Inc.',
      type: 'text',
      label: 'Business Partner',
      section: '_mainSection',
      required: true,
    },
    partnerAddress: {
      value: '123 Tech St, Silicon Valley, CA',
      type: 'text',
      label: 'Partner Address',
      section: '_mainSection',
    },
    priceList: {
      value: 'Standard Price List',
      type: 'text',
      label: 'Price List',
      section: '_mainSection',
    },
    scheduledDeliveryDate: {
      value: '2023-08-30',
      type: 'date',
      label: 'Scheduled Delivery Date',
      section: '_mainSection',
    },
    paymentMethod: {
      value: 'Credit Card',
      type: 'text',
      label: 'Payment Method',
      section: '_mainSection',
    },
    paymentTerms: {
      value: 'Net 30',
      type: 'text',
      label: 'Payment Terms',
      section: '_mainSection',
    },
    _linkedItems: {
      name: '_linkedItems',
      label: 'Linked Items',
      type: 'section',
      personalizable: false,
    },
    warehouse: {
      value: 'Main Warehouse',
      type: 'text',
      label: 'Warehouse',
      section: '_linkedItems',
    },
    invoiceTerms: {
      value: 'Standard Terms',
      type: 'text',
      label: 'Invoice Terms',
      section: '_linkedItems',
    },
    orderReference: {
      value: 'REF-001',
      type: 'text',
      label: 'Order Reference',
      section: '_linkedItems',
    },
    _moreInformation: {
      name: '_moreInformation',
      label: 'More Information',
      type: 'section',
      personalizable: false,
    },
    salesRepresentative: {
      value: 'John Doe',
      type: 'text',
      label: 'Sales Representative',
      section: '_moreInformation',
    },
    description: {
      value: 'Order for Q3 supplies',
      type: 'text',
      label: 'Description',
      section: '_moreInformation',
    },
    invoiceAddress: {
      value: '456 Finance Ave, New York, NY',
      type: 'text',
      label: 'Invoice Address',
      section: '_moreInformation',
    },
    _attachments: {
      name: '_attachments',
      label: 'Attachments',
      type: 'section',
      personalizable: false,
    },
    deliveryLocation: {
      value: '789 Delivery Rd, Los Angeles, CA',
      type: 'text',
      label: 'Delivery Location',
      section: '_attachments',
    },
    quotation: {
      value: 'Q-001',
      type: 'text',
      label: 'Quotation',
      section: '_attachments',
    },
    cancelledorder: {
      value: 'ASD',
      type: 'text',
      label: 'Cancelled Order',
      section: '_attachments',
    },
    project: { value: 'Q3 Expansion', type: 'text', label: 'Project' },
    id: { value: '1', type: 'text', label: 'ID' },
  },
  {
    organization: {
      value: 'Global X',
      type: 'text',
      label: 'Organization',
    },
    transactionDocument: {
      value: 'Sales Order',
      type: 'text',
      label: 'Transaction Document',
    },
    documentNo: { value: 'SO-002', type: 'text', label: 'Document No.' },
    orderDate: { value: '2023-08-15', type: 'date', label: 'Order Date' },
    businessPartner: {
      value: 'Etendo.',
      type: 'text',
      label: 'Business Partner',
    },
    partnerAddress: {
      value: '123 Tech St, Silicon Valley, CA',
      type: 'text',
      label: 'Partner Address',
    },
    priceList: {
      value: 'Standard Price List',
      type: 'text',
      label: 'Price List',
    },
    scheduledDeliveryDate: {
      value: '2023-08-30',
      type: 'date',
      label: 'Scheduled Delivery Date',
    },
    paymentMethod: {
      value: 'Credit Card',
      type: 'text',
      label: 'Payment Method',
    },
    paymentTerms: { value: 'Net 30', type: 'text', label: 'Payment Terms' },
    warehouse: { value: 'Main Warehouse', type: 'text', label: 'Warehouse' },
    invoiceTerms: {
      value: 'Standard Terms',
      type: 'text',
      label: 'Invoice Terms',
    },
    orderReference: {
      value: 'REF-001',
      type: 'text',
      label: 'Order Reference',
    },
    salesRepresentative: {
      value: 'John Doe',
      type: 'text',
      label: 'Sales Representative',
    },
    description: {
      value: 'Order for Q3 supplies',
      type: 'text',
      label: 'Description',
    },
    invoiceAddress: {
      value: '456 Finance Ave, New York, NY',
      type: 'text',
      label: 'Invoice Address',
    },
    deliveryLocation: {
      value: '789 Delivery Rd, Los Angeles, CA',
      type: 'text',
      label: 'Delivery Location',
    },
    quotation: { value: 'Q-001', type: 'text', label: 'Quotation' },
    cancelledorder: { value: '', type: 'text', label: 'Cancelled Order' },
    replacedorder: { value: '', type: 'text', label: 'Replaced Order' },
    iscancelled: { value: false, type: 'boolean', label: 'Is Cancelled' },
    externalBusinessPartnerReference: {
      value: 'EXT-001',
      type: 'text',
      label: 'External Business Partner Reference',
    },
    project: { value: 'Q3 Expansion', type: 'text', label: 'Project' },
    costcenter: {
      value: 'Sales Department',
      type: 'text',
      label: 'Cost Center',
    },
    asset: { value: 'N/A', type: 'text', label: 'Asset' },
    stDimension: { value: 'West Coast', type: 'text', label: '1st Dimension' },
    ndDimension: {
      value: 'Technology Sector',
      type: 'text',
      label: '2nd Dimension',
    },
    creationDate: { value: '2023-08-14', type: 'date', label: 'Creation Date' },
    createdBy: { value: 'System Admin', type: 'text', label: 'Created By' },
    updated: { value: '2023-08-15', type: 'date', label: 'Updated' },
    updatedBy: { value: 'John Doe', type: 'text', label: 'Updated By' },
    documentStatus: { value: 'Draft', type: 'text', label: 'Document Status' },
    grandTotalAmount: {
      value: 10000,
      type: 'number',
      label: 'Grand Total Amount',
    },
    summedLineAmount: {
      value: 9000,
      type: 'number',
      label: 'Summed Line Amount',
    },
    currency: { value: 'USD', type: 'text', label: 'Currency' },
    reservationStatus: {
      value: 'Fully Reserved',
      type: 'text',
      label: 'Reservation Status',
    },
    deliveryStatus: {
      value: 'Pending',
      type: 'text',
      label: 'Delivery Status',
    },
    invoiceStatus: {
      value: 'Not Invoiced',
      type: 'text',
      label: 'Invoice Status',
    },
    delivered: { value: false, type: 'boolean', label: 'Delivered' },
    id: { value: '2', type: 'text', label: 'ID' },
  },
  {
    organization: {
      value: 'Global USA',
      type: 'text',
      label: 'Organization',
    },
    transactionDocument: {
      value: 'Sales',
      type: 'text',
      label: 'Transaction Document',
    },
    documentNo: { value: 'SO-003', type: 'text', label: 'Document No.' },
    orderDate: { value: '2023-08-15', type: 'date', label: 'Order Date' },
    businessPartner: {
      value: 'Futit Inc.',
      type: 'text',
      label: 'Business Partner',
    },
    partnerAddress: {
      value: '123 Tech St, Silicon Valley, CA',
      type: 'text',
      label: 'Partner Address',
    },
    priceList: {
      value: 'Standard Price List',
      type: 'text',
      label: 'Price List',
    },
    scheduledDeliveryDate: {
      value: '2023-08-30',
      type: 'date',
      label: 'Scheduled Delivery Date',
    },
    paymentMethod: {
      value: 'Credit Card',
      type: 'text',
      label: 'Payment Method',
    },
    paymentTerms: { value: 'Net 30', type: 'text', label: 'Payment Terms' },
    warehouse: { value: 'Main Warehouse', type: 'text', label: 'Warehouse' },
    invoiceTerms: {
      value: 'Standard Terms',
      type: 'text',
      label: 'Invoice Terms',
    },
    orderReference: {
      value: 'REF-001',
      type: 'text',
      label: 'Order Reference',
    },
    salesRepresentative: {
      value: 'John Doe',
      type: 'text',
      label: 'Sales Representative',
    },
    description: {
      value: 'Order for Q3 supplies',
      type: 'text',
      label: 'Description',
    },
    invoiceAddress: {
      value: '456 Finance Ave, New York, NY',
      type: 'text',
      label: 'Invoice Address',
    },
    deliveryLocation: {
      value: '789 Delivery Rd, Los Angeles, CA',
      type: 'text',
      label: 'Delivery Location',
    },
    quotation: { value: 'Q-001', type: 'text', label: 'Quotation' },
    cancelledorder: { value: '', type: 'text', label: 'Cancelled Order' },
    replacedorder: { value: '', type: 'text', label: 'Replaced Order' },
    iscancelled: { value: false, type: 'boolean', label: 'Is Cancelled' },
    externalBusinessPartnerReference: {
      value: 'EXT-001',
      type: 'text',
      label: 'External Business Partner Reference',
    },
    project: { value: 'Q3 Expansion', type: 'text', label: 'Project' },
    costcenter: {
      value: 'Sales Department',
      type: 'text',
      label: 'Cost Center',
    },
    asset: { value: 'N/A', type: 'text', label: 'Asset' },
    stDimension: { value: 'West Coast', type: 'text', label: '1st Dimension' },
    ndDimension: {
      value: 'Technology Sector',
      type: 'text',
      label: '2nd Dimension',
    },
    creationDate: { value: '2023-08-14', type: 'date', label: 'Creation Date' },
    createdBy: { value: 'System Admin', type: 'text', label: 'Created By' },
    updated: { value: '2023-08-15', type: 'date', label: 'Updated' },
    updatedBy: { value: 'John Doe', type: 'text', label: 'Updated By' },
    documentStatus: { value: 'Draft', type: 'text', label: 'Document Status' },
    grandTotalAmount: {
      value: 10000,
      type: 'number',
      label: 'Grand Total Amount',
    },
    summedLineAmount: {
      value: 9000,
      type: 'number',
      label: 'Summed Line Amount',
    },
    currency: { value: 'USD', type: 'text', label: 'Currency' },
    reservationStatus: {
      value: 'Fully Reserved',
      type: 'text',
      label: 'Reservation Status',
    },
    deliveryStatus: {
      value: 'Pending',
      type: 'text',
      label: 'Delivery Status',
    },
    invoiceStatus: {
      value: 'Not Invoiced',
      type: 'text',
      label: 'Invoice Status',
    },
    delivered: { value: false, type: 'boolean', label: 'Delivered' },
    id: { value: '3', type: 'text', label: 'ID' },
  },
];
