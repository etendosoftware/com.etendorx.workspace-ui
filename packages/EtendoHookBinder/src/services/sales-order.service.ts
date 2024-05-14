import { pageMetadata } from "../api/sales-order.api";
import { SalesOrderColumnsDTO, mapSalesOrderColumnsResponseToDTO } from "../dtos/sales-order.dto";

export const columsPageMetadata = async (): Promise<SalesOrderColumnsDTO[]> => { 
  const response = await pageMetadata();
  return mapSalesOrderColumnsResponseToDTO(response);

}