export declare global {
  interface Window {
    isc: {
      ClassFactory: {
        defineClass: (
          className: string,
          superClass: string,
        ) => {
          addProperties: (
            properties: Etendo.WindowMetadataProperties,
          ) => typeof window.isc.ClassFactory;
        };
      };
    };
    OB: Record<string, unknown>;
    Metadata: unknown;
  }
}
