import { Models } from '../Models';
import { createClient } from './client';
import { API_BASE_URL } from './constants';

const axiosPrivate = createClient(API_BASE_URL);

export const pageMetadata = async (): Promise<Models> => {
  return axiosPrivate.get<Models>('/sws/view').then(res => res.data);
};

export const dataSet = (page: number, size: number): Promise<unknown> => {
  return axiosPrivate.post('/etendo/org.openbravo.service.datasource/Order', {
    params: { page, size },
  });
};
