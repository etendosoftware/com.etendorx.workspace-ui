import {
  API_DEFAULT_CACHE_DURATION,
  API_METADATA_URL,
} from './constants';
import { Client } from './client';
import { onChange } from './helpers';
import { CacheStore } from './cache';
import * as Etendo from './types';

export type { Etendo };

const hasProperty = (object: object, property: string) =>
  Object.prototype.hasOwnProperty.call(object, property);

export class Metadata {
  public static client = new Client(API_METADATA_URL);
  private static cache = new CacheStore(API_DEFAULT_CACHE_DURATION);

  public static authorize(token: string) {
    this.client.setAuthHeader(token, 'Bearer');
  }

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
    Application: Metadata.createProxy({
      menu: [],
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;

  public static initialize = async () => {
    if (!hasProperty(window, 'OB')) {
      Object.defineProperty(window, 'OB', {
        value: Metadata.OB,
        writable: false,
      });
    }

    if (!hasProperty(window, 'isc')) {
      Object.defineProperty(window, 'isc', {
        value: Metadata.isc,
        writable: false,
      });
    }

    if (!hasProperty(window, 'Metadata')) {
      Object.defineProperty(window, 'Metadata', {
        value: Metadata,
        writable: false,
      });
    }

    if (!hasProperty(Array.prototype, 'sortByProperty')) {
      Object.defineProperty(Array.prototype, 'sortByProperty', {
        value: () => null,
        writable: false,
      });
    }

    return true;
  };

  // TODO: Remove empty object and update with the right value
  public static standardWindow = {};

  private static async _getWindow(
    windowId: Etendo.WindowId,
  ): Promise<Etendo.WindowMetadata> {
    const response = await Metadata.client.get(
      `OBUIAPP_MainLayout/View?viewId=_${windowId}`,
    );

    this.client.run(response.data);

    const value = Metadata.isc.classes[`_${windowId}`];

    Metadata.cache.set(windowId, value);

    return value;
  }

  public static async getWindow(
    windowId: Etendo.WindowId,
  ): Promise<Etendo.WindowMetadata> {
    Metadata.initialize();

    const cached = Metadata.cache.get(windowId);

    if (cached) {
      Metadata.isc.classes[windowId] = cached;

      return cached;
    } else {
      return Metadata._getWindow(windowId);
    }
  }

  public static getColumns(tabId: string) {
    const item = Object.values(Metadata.isc.classes).find(windowObj => {
      const val =
        windowObj.properties?.viewProperties?.tabId?.toString() ===
        tabId.toString();

      return val;
    });

    if (!item) {
      return [];
    }

    return item.properties.viewProperties.fields;
  }

  public static async getSession() {
    const response = await Metadata.client.get(
      `/OBCLKER_Kernel/SessionDynamic`,
    );

    this.client.run(response.data);

    return Metadata.OB.User;
  }

  public static async getMenu() {
    const cached = Metadata.cache.get('OBMenu');

    if (cached && cached.length) {
      Metadata.OB.Application.menu = cached;

      return cached;
    } else {
      await Metadata.getSession();
      const menu = Metadata.OB.Application.menu;
      Metadata.cache.set('OBMenu', menu);

      return menu;
    }
  }

  public static getCachedMenu() {
    return Metadata.cache.get('OBMenu') ?? [];
  }
}
