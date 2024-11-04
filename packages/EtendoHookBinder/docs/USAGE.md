## Etendo Hook Binder

# Examples:

You can use the metadata module by using the helpers provided by the Metadata Context Provider or you can directly access the metadata using the provided react hooks.

In case you want to go with the context approach, you must wrap your main App like follows:

```tsx
import MetadataProvider from '@workspaceui/etendohookbinder/contexts/metadata';
.
.
.
export default function App() {
  return (
    <MetadataProvider>
      <Home />
    </MetadataProvider>
  );
}
```

Then, you can access the metadata using the getWindow and getColumns functions:
```tsx
import { useMetadataContext } from '@workspaceui/etendohookbinder/src/hooks/useMetadataContext';

export default function Home() {
  const { getWindow, getColumns } = useMetadataContext();

  useEffect(() => {
    getWindow('100').then(w => {
      console.debug('Window Metadata for Window ID 100');
      console.debug(w);
    });
    getColumns('100').then(cols => {
      console.debug('Window Columns for Window ID 100');
      console.debug(cols);
    });
  }, [getColumns, getWindow]);
}
 
```

In case you want to use the 2nd approach and avoid using react contexts, you can use the hooks like follows:

```tsx
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';

export default function Home() {
  const { data } = useWindow('100'); // windowId = 100

  useEffect(() => {
    console.debug('Window Metadata for Window ID 100');
    console.debug(data); // data is an Etendo.WindowMetadata
  }, [data]);
}
 
```

The usage of useWindow and useColumns is pretty much lookalike:


```tsx
import { useColumns } from '@workspaceui/etendohookbinder/src/hooks/useColumns';

export default function Home() {
  const { data } = useColumns('100'); // windowId = 100

  useEffect(() => {
    console.debug('Window Columns Metadata for Window ID 100');
    console.debug(data); // data is an array of Etendo.Field
  }, [data]);
}
 
```