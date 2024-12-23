import { ReportMetadata } from '../hooks/types';

export const INVOICED_SALES_ORDERS_REPORT_META: ReportMetadata = {
  id: '800069',
  title: 'Invoiced sale orders report',
  sourcePath: 'ReportSalesOrderInvoicedJasper',
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
          id: 'businessPartner',
          name: 'inpcBPartnerId',
          label: 'Business Partner',
          type: 'search',
          required: false,
          gridWidth: 2,
          lookupConfig: {
            selector: {
              icon: 'BusinessPartner',
              title: 'Business Partner',
            },
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
              title: 'Project',
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
        {
          id: 'productCategory',
          name: 'inpProductCategory',
          label: 'Product Category',
          type: 'select',
          required: false,
          gridWidth: 2,
          lookupConfig: {
            url: '/api/selector/productCategories',
          },
        },
        {
          id: 'product',
          name: 'inpmProductId',
          label: 'Product',
          type: 'search',
          required: false,
          gridWidth: 2,
          lookupConfig: {
            selector: {
              icon: 'Product',
              title: 'Product',
            },
          },
        },
        {
          id: 'projectKind',
          name: 'inpProjectkind',
          label: 'Building Site Type',
          type: 'select',
          required: false,
          gridWidth: 2,
          lookupConfig: {
            url: '/api/selector/projectKinds',
          },
        },
        {
          id: 'projectPublic',
          name: 'inpProjectpublic',
          label: 'Initiative Type',
          type: 'select',
          required: false,
          gridWidth: 2,
          lookupConfig: {
            url: '/api/selector/projectPublics',
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
      command: 'FIND',
    },
  ],
};
