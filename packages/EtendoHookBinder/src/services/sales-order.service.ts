import axiosPrivate from "../api";


export const pageMetadata = (): Promise<unknown> => {
  return axiosPrivate.get('/sws/view');
};
export const dataSet = (page: number, size: number): Promise<unknown> => {
  return axiosPrivate.post('/etendo/org.openbravo.service.datasource/Order', {
    params: { page, size },
  } );
};

