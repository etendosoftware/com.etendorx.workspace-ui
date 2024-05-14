import axiosPrivate from ".";
import { Models } from "../Models";


export const pageMetadata = async (): Promise<Models> => {
  return axiosPrivate.get<Models>('/sws/view').then((res) => res.data);
};

export const dataSet = (page: number, size: number): Promise<unknown> => {
  return axiosPrivate.post('/etendo/org.openbravo.service.datasource/Order', {
    params: { page, size },
  } );
};

