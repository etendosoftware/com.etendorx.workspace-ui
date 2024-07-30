import axios from "axios";
import { API_BASE_URL } from "../constants";
import { buildParams } from "./helpers";

export const datasource = axios.create({
  baseURL: API_BASE_URL,
  // To Do: Implemenet JWT authentication for org.openbravo.service.datasource
  withCredentials: true,
});

export const get = (
  entity: Etendo.Entity,
  options: Partial<Etendo.GETOptions> = {
    _startRow: '1',
    _endRow: '1',
  },
): Promise<unknown> => {
  return datasource.post(
    `/etendo/org.openbravo.service.datasource/${entity}`,
    buildParams(options)
  );
};
