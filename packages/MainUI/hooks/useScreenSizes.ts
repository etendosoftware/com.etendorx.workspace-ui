const defaultSizes = { clientWidth: 480, clientHeight: 240 };

export const useScreenSizes = () => {
  if (typeof window !== 'undefined') {
    return {
      clientWidth: window.document.body.clientWidth,
      clientHeight: window.document.body.clientHeight,
    };
  }
  return defaultSizes;
};
