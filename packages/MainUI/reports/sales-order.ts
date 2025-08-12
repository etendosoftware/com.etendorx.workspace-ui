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

import type { ReportMetadata } from "@workspaceui/api-client/src/hooks/types";

export const SALES_ORDER_REPORT_META: ReportMetadata = {
  id: "800261",
  title: "Sales Order Report",
  sourcePath: "ReportSalesOrderFilterJR",
  sections: [
    {
      id: "filter",
      title: "Filter",
      fields: [
        {
          id: "dateFrom",
          name: "inpDateFrom",
          label: "From Date",
          type: "date",
          required: true,
          validation: {
            lowerThan: "dateTo",
          },
        },
        {
          id: "dateTo",
          name: "inpDateTo",
          label: "To Date",
          type: "date",
          required: true,
          validation: {
            greaterThan: "dateFrom",
          },
        },
        {
          id: "currency",
          name: "inpCurrencyId",
          label: "Currency",
          type: "select",
          required: true,
          entity: "Currency",
          lookupConfig: {
            url: "/api/selector/currencies",
          },
        },
        {
          id: "project",
          name: "inpcProjectId",
          label: "Project",
          type: "search",
          required: false,
          gridWidth: 2,
          lookupConfig: {
            selector: {
              icon: "Project",
              title: "Search Project",
            },
          },
        },
        {
          id: "warehouse",
          name: "inpmWarehouseId",
          label: "Warehouse",
          type: "select",
          required: false,
          gridWidth: 2,
          entity: "Warehouse",
          lookupConfig: {
            url: "/api/selector/warehouses",
          },
        },
        {
          id: "region",
          name: "inpcRegionId",
          label: "Region",
          type: "select",
          required: false,
          gridWidth: 2,
          lookupConfig: {
            url: "/api/selector/regions",
          },
        },
        {
          id: "businessPartner",
          name: "inpcBPartnerId_IN",
          label: "Business Partner",
          type: "multiselect",
          required: false,
          gridWidth: 2,
          entity: "BusinessPartner",
          columnName: "C_BPartner_ID",
          identifierField: "name",
          columns: [
            {
              header: "Key",
              accessorKey: "searchKey",
            },
            {
              header: "Name",
              accessorKey: "_identifier",
            },
            {
              header: "Credit Available",
              accessorKey: "creditStatus",
            },
            {
              header: "Credit Used",
              accessorKey: "creditUsed",
            },
            {
              header: "Sales Representative",
              accessorKey: "salesRepresentative",
            },
            {
              header: "URL",
              accessorKey: "url",
            },
            {
              header: "Email",
              accessorKey: "email",
            },
          ],
          lookupConfig: {
            multiple: true,
            selector: {
              title: "Select Business Partners",
            },
          },
        },
        {
          id: "product",
          name: "inpmProductId_IN",
          label: "Product",
          type: "multiselect",
          required: false,
          gridWidth: 2,
          entity: "Product",
          columnName: "M_Product_ID",
          identifierField: "name",
          columns: [
            {
              header: "Key",
              accessorKey: "searchKey",
            },
            {
              header: "Name",
              accessorKey: "name",
            },
            {
              header: "Category",
              accessorKey: "productCategory$_identifier",
            },
          ],
          lookupConfig: {
            multiple: true,
            selector: {
              title: "Select Products",
            },
          },
        },
        {
          id: "productCategory",
          name: "inpmProductCategoryId",
          label: "Product Category",
          type: "multiselect",
          required: false,
          gridWidth: 2,
          entity: "ProductCategory",
          columnName: "M_Product_Category_ID",
          identifierField: "name",
          lookupConfig: {
            url: "/api/selector/productCategories",
            multiple: true,
          },
        },
      ],
    },
  ],
  actions: [
    {
      id: "html",
      name: "HTML Format",
      format: "html",
      command: "EDIT_HTML",
    },
    {
      id: "pdf",
      name: "PDF Format",
      format: "pdf",
      command: "EDIT_PDF",
    },
  ],
};
