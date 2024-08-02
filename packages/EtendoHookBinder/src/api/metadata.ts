import { API_DEFAULT_CACHE_DURATION, API_METADATA_URL } from './constants';
import { Client } from './client';
import { onChange } from './helpers';

export class Metadata {
  private static cache: Etendo.CacheStore<Etendo.WindowMetadata> = {};
  private static client = new Client(API_METADATA_URL);
  private static CACHE_DURATION = API_DEFAULT_CACHE_DURATION;

  private static isc = {
    classes: {} as Etendo.WindowMetadataMap,
    ClassFactory: {
      defineClass: (className: string, superClass: string) => {
        return {
          addProperties: (properties: Etendo.WindowMetadataProperties) => {
            const cn = className.split('_');
            const newClassName = '_' + cn[1].toString();

            if (!Metadata.isc.classes[newClassName]) {
              Metadata.isc.classes[newClassName] = {
                name: className,
                superClass: superClass,
                properties: {} as Etendo.WindowMetadataProperties,
              };
            }

            Metadata.isc.classes[newClassName].properties = {
              ...Metadata.isc.classes[newClassName].properties,
              ...properties,
            };

            return Metadata.isc.ClassFactory;
          },
        };
      },
    },
  };

  private static createProxy(obj: Record<string, unknown>) {
    return new Proxy(obj, {
      get(target, prop: string) {
        if (!(prop in target)) {
          target[prop] = Metadata.createProxy({});
        }
        return target[prop];
      },
    });
  }

  private static OB = Metadata.createProxy({
    KernelUtilities: Metadata.createProxy({
      handleSystemException: (err: unknown) => {
        throw err;
      },
    }),
    PropertyStore: Metadata.createProxy({
      get: (...args: unknown[]) => {
        console.log(
          'OB.PropertyStore.get called with the following args: ',
          args,
        );

        return args;
      },
    }),
    OnChange: Metadata.createProxy({
      organizationCurrency: onChange('organizationCurrency'),
      processDefinitionUIPattern: onChange('processDefinitionUIPattern'),
      agingProcessDefinitionOverdue: onChange('agingProcessDefinitionOverdue'),
      colorSelection: onChange('colorSelection'),
      agingProcessDefinitionOrganization: onChange(
        'agingProcessDefinitionOrganization',
      ),
    }),
  });

  private static setup() {
    window.OB = window.OB || Metadata.OB;
    window.isc = window.isc || Metadata.isc;
    window.Metadata = window.Metadata || Metadata;
  }

  private static hasValidCache(windowId: Etendo.WindowId) {
    if (Metadata.cache[windowId]?.data) {
      return (
        Date.now() - Metadata.cache[windowId].updatedAt <
        Metadata.CACHE_DURATION
      );
    }

    return false;
  }

  // TODO: Remove empty object and update with the right value
  public static standardWindow = {};

  public static async getWindow(
    windowId: Etendo.WindowId,
  ): Promise<Etendo.WindowMetadata> {
    Metadata.setup();

    if (Metadata.hasValidCache(windowId)) {
      return Metadata.cache[windowId].data;
    }

    try {
      const response = await Metadata.client.get(`View?viewId=_${windowId}`);
      const script = document.createElement('script');

      script.type = 'text/javascript';
      script.textContent = response.data;
      document.head.appendChild(script);
      document.head.removeChild(script);

      Metadata.cache[windowId] = {
        updatedAt: Date.now(),
        data: Metadata.isc.classes[`_${windowId}`],
      };

      return Metadata.cache[windowId].data;
    } catch (error) {
      throw new Error(
        `Error fetching metadata for window ${windowId}:\n${(error as Error).message}`,
      );
    }
  }

  public static async getColumns(windowId: string) {
    const metadata = await Metadata.getWindow(windowId);

    return metadata.properties.viewProperties.fields;
  }
}
