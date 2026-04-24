export const createMockURL = () => {
  const createObjectURLMock = jest.fn().mockReturnValue("blob:http://localhost/mock-blob-url");
  const revokeObjectURLMock = jest.fn();

  global.URL.createObjectURL = createObjectURLMock;
  global.URL.revokeObjectURL = revokeObjectURLMock;

  return { createObjectURLMock, revokeObjectURLMock };
};

export const mockUserContextState = (token: string | null = "mock-token") => ({
  token,
});

export const mockTranslationState = () => ({
  t: (key: string) => key,
});

export const createFetchMock = (ok: boolean, response: any, status = 200, statusText = "OK") => {
  const fetchMock = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok,
      status,
      statusText,
      json: () => Promise.resolve(response),
      blob: () => Promise.resolve(new Blob(["mock-blob"])),
      text: () => Promise.resolve(response),
    })
  ) as jest.Mock;
  global.fetch = fetchMock as any;
  return fetchMock;
};

export const createFetchRejectMock = (errorMsg: string) => {
  const fetchMock = jest.fn().mockImplementation(() => Promise.reject(new Error(errorMsg))) as jest.Mock;
  global.fetch = fetchMock as any;
  return fetchMock;
};
