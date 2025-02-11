import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export const APIContext = createContext('');

export const useAPIContext = () => useContext(APIContext);

export default function APIProvider(props: React.PropsWithChildren) {
  const [url, setUrl] = useState('');

  const loadUrl = useCallback(async () => {
    const response = await fetch('/api/url');

    if (response.ok) {
      const json = await response.json();
      setUrl(json.url);
    } else {
      throw new Error(`Could not get API url: ${response.statusText}`);
    }
  }, []);

  useEffect(() => {
    loadUrl();
  }, [loadUrl]);

  return <APIContext.Provider value={url}>{url ? props.children : null}</APIContext.Provider>;
}
