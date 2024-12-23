import { ReportMetadata } from '../hooks/types';

export const SALES_ORDER_REPORT_META: ReportMetadata = {
  id: '800261',
  title: 'Sales Order Report',
  sourcePath: 'ReportSalesOrderFilterJR',
  sections: [
    {
      id: 'filter',
      title: 'Filter',
      fields: [
        {
          id: 'dateFrom',
          name: 'inpDateFrom',
          label: 'From Date',
          type: 'date',
          required: true,
          validation: {
            lowerThan: 'dateTo',
          },
        },
        {
          id: 'dateTo',
          name: 'inpDateTo',
          label: 'To Date',
          type: 'date',
          required: true,
          validation: {
            greaterThan: 'dateFrom',
          },
        },
        {
          id: 'currency',
          name: 'inpCurrencyId',
          label: 'Currency',
          type: 'select',
          required: true,
          lookupConfig: {
            url: '/api/selector/currencies',
          },
        },
        {
          id: 'project',
          name: 'inpcProjectId',
          label: 'Project',
          type: 'search',
          required: false,
          gridWidth: 2,
          lookupConfig: {
            selector: {
              icon: 'Project',
              title: 'Search Project',
            },
          },
        },
        {
          id: 'warehouse',
          name: 'inpmWarehouseId',
          label: 'Warehouse',
          type: 'select',
          required: false,
          gridWidth: 2,
          lookupConfig: {
            url: '/api/selector/warehouses',
          },
        },
        {
          id: 'businessPartner',
          name: 'inpcBPartnerId_IN',
          label: 'Business Partner',
          type: 'multiselect',
          required: false,
          gridWidth: 2,
          lookupConfig: {
            multiple: true,
            selector: {
              title: 'Select Business Partners',
            },
          },
        },
        {
          id: 'product',
          name: 'inpmProductId_IN',
          label: 'Product',
          type: 'multiselect',
          required: false,
          gridWidth: 2,
          lookupConfig: {
            multiple: true,
            selector: {
              title: 'Select Products',
            },
          },
        },
        {
          id: 'productCategory',
          name: 'inpmProductCategoryId',
          label: 'Product Category',
          type: 'multiselect',
          required: false,
          gridWidth: 2,
          lookupConfig: {
            url: '/api/selector/productCategories',
            multiple: true,
          },
        },
        {
          id: 'region',
          name: 'inpcRegionId',
          label: 'Region',
          type: 'select',
          required: false,
          gridWidth: 2,
          lookupConfig: {
            url: '/api/selector/regions',
          },
        },
      ],
    },
  ],
  actions: [
    {
      id: 'html',
      name: 'HTML Format',
      format: 'html',
      command: 'EDIT_HTML',
    },
    {
      id: 'pdf',
      name: 'PDF Format',
      format: 'pdf',
      command: 'EDIT_PDF',
    },
  ],
};
