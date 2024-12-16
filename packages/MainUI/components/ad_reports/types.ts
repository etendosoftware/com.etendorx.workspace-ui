export interface SalesOrderFormType {
  dateFrom: string;
  dateTo: string;
  currency: string;
  project: string;
  warehouse: string;
  region: string;
  businessPartners: string[];
  products: string[];
  productCategories: string[];
}
