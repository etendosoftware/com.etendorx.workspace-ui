import { API_METADATA_URL } from './constants';
import { newClient } from './client';

export class Metadata {
  private static cache: Etendo.CacheStore<Etendo.Klass> = {};
  private static client = newClient(API_METADATA_URL);
  private static classes: Etendo.ClassMap = {};

  private static isc = {
    ClassFactory: {
      defineClass: (className: string, superClass: string) => {
        return {
          addProperties: (properties: unknown[]) => {
            const cn = className.split('_');
            const newClassName = '_' + cn[1].toString();

            if (!this.classes[newClassName]) {
              this.classes[newClassName] = {
                name: className,
                superClass: superClass,
                properties: [],
              };
            }

            this.classes[newClassName].properties.push(properties);

            return this.isc.ClassFactory;
          },
        };
      },
    },
  };

  private static createProxy(obj: Record<string, unknown>) {
    const createProxy = (args: typeof obj) => this.createProxy(args);

    return new Proxy(obj, {
      get(target, prop: string) {
        if (!(prop in target)) {
          target[prop] = createProxy({});
        }
        return target[prop];
      },
    });
  }

  private static OB = this.createProxy({
    KernelUtilities: this.createProxy({
      handleSystemException: (err: unknown) => {
        throw err;
      },
    }),
  });

  public static setup() {
    window.OB = window.OB ?? this.OB;
    window.isc = window.isc ?? this.isc;
    window.classes = window.classes ?? this.classes;
  }

  public static hasValidCache(windowId: Etendo.WindowId) {
    if (this.cache[windowId]?.data) {
      // TO DO: Replace hardcoded 1 hour value (360000ms) with configurable setting
      return Date.now() - this.cache[windowId].updatedAt < 3600000;
    }

    return false;
  }

  public static async get(windowId: Etendo.WindowId): Promise<Etendo.Klass> {
    this.setup();

    if (this.hasValidCache(windowId)) {
      return this.cache[windowId].data;
    }

    try {
      const response = await this.client.get(`View?viewId=_${windowId}`);

      // TO DO: Avoid the .replace and fix standardWindow issue
      eval(response.data.replace('this.standardWindow', 'null '));

      this.cache[windowId] = {
        updatedAt: Date.now(),
        data: window.classes[`_${windowId}`],
      };

      return this.cache[windowId].data;
    } catch (error) {
      throw new Error(
        `Error fetching metadata for window ${windowId}:\n${error}`,
      );
    }
  }
}
