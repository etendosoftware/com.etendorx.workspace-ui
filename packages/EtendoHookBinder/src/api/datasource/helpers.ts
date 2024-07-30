export const buildParams = (data: Partial<Etendo.GETOptions>) =>
  new URLSearchParams({ _operationType: 'fetch', ...data });
