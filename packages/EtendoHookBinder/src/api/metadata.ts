import { API_DEFAULT_CACHE_DURATION, API_METADATA_URL } from './constants';
import { Client } from './client';
import { onChange } from './helpers';
import { CacheStore } from './cache';
import * as Etendo from './types';

export type { Etendo };

export class Metadata {
  private static client = new Client(API_METADATA_URL);
  private static cache = new CacheStore<Etendo.WindowMetadata>(
    API_DEFAULT_CACHE_DURATION,
  );
  private static initialized = false;

  public static isc = {
    classes: {} as Etendo.WindowMetadataMap,
    ClassFactory: {
      defineClass: (className: string, superClass: string) => ({
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
      }),
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

  public static OB = Metadata.createProxy({
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
    Application: Metadata.createProxy({}),
  });

  private static setup = async () => {
    if (Metadata.initialized) {
      return;
    } else {
      Metadata.initialized = true;
    }

    Object.defineProperty(window, 'OB', { value: Metadata.OB });
    Object.defineProperty(window, 'isc', { value: Metadata.isc });
    Object.defineProperty(Array.prototype, 'sortByProperty', {
      value: () => null,
    });

    return Metadata.getSession();
  };

  // TODO: Remove empty object and update with the right value
  public static standardWindow = {};

  private static async _getWindow(
    windowId: Etendo.WindowId,
  ): Promise<Etendo.WindowMetadata> {
    try {
      const response = await Metadata.client.get(
        `OBUIAPP_MainLayout/View?viewId=_${windowId}`,
      );
      const script = document.createElement('script');

      script.type = 'text/javascript';
      script.textContent = response.data;
      document.head.appendChild(script);
      document.head.removeChild(script);

      const value = Metadata.isc.classes[`_${windowId}`];

      Metadata.cache.set(windowId, value);

      return value;
    } catch (error) {
      throw new Error(
        `Error fetching metadata for window ${windowId}:\n${(error as Error).message}`,
      );
    }
  }

  public static async getWindow(
    windowId: Etendo.WindowId,
  ): Promise<Etendo.WindowMetadata> {
    await Metadata.setup();

    const cached = Metadata.cache.get(windowId);

    if (cached) {
      return cached;
    } else {
      return Metadata._getWindow(windowId);
    }
  }

  public static async getColumns(tabId: string) {
    const item = Object.values(Metadata.isc.classes).find(
      windowObj =>
        windowObj.properties.viewProperties.tabId.toString() ===
        tabId.toString(),
    );

    if (!item) {
      return [];
    }

    return item.properties.viewProperties.fields;
  }

  public static async getSession() {
    const response = await Metadata.client.get(
      `/OBCLKER_Kernel/SessionDynamic`,
    );
    const script = document.createElement('script');

    script.type = 'text/javascript';
    script.textContent = response.data;
    document.head.appendChild(script);
    document.head.removeChild(script);
  }
}
