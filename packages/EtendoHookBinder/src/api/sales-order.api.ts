import { Models } from '../Models';
import { Client } from './client';
import { API_BASE_URL } from './constants';

const axiosPrivate = new Client(API_BASE_URL);

export const pageMetadata = async (): Promise<Models> => {
  return axiosPrivate.get('/sws/view').then(res => res.data);
};

export const dataSet = (page: number, size: number): Promise<unknown> => {
  return axiosPrivate.post('/etendo/org.openbravo.service.datasource/Order', {
    body: JSON.stringify({ page, size }),
  });
};
