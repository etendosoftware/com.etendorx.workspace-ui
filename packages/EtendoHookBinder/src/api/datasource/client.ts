import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { buildParams } from './helpers';

export const datasource = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const get = (
  entity: Etendo.Entity,
  options: Partial<Etendo.GETOptions> = {},
) => {
  return datasource.post(
    `/etendo/org.openbravo.service.datasource/${entity}`,
    buildParams(options),
  );
};
