import { API_METADATA_URL } from './constants';
import { createClient } from './client';
import { onChange } from './helpers';

export class Metadata {
  private static cache: Etendo.CacheStore<Etendo.WindowMetadata> = {};
  private static client = createClient(API_METADATA_URL);
  private static CACHE_DURATION = 6e5;

  private static isc = {
    classes: {} as Etendo.WindowMetadataMap,
    ClassFactory: {
      defineClass: (className: string, superClass: string) => {
        return {
          addProperties: (properties: Etendo.WindowMetadataProperties) => {
            const cn = className.split('_');
            const newClassName = '_' + cn[1].toString();

            if (!this.isc.classes[newClassName]) {
              this.isc.classes[newClassName] = {
                name: className,
                superClass: superClass,
                properties: {} as Etendo.WindowMetadataProperties,
              };
            }

            this.isc.classes[newClassName].properties = {
              ...this.isc.classes[newClassName].properties,
              ...properties,
            };

            return this.isc.ClassFactory;
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

  private static OB = this.createProxy({
    KernelUtilities: this.createProxy({
      handleSystemException: (err: unknown) => {
        throw err;
      },
    }),
    PropertyStore: this.createProxy({
      get: (...args: unknown[]) => {
        console.log(
          'OB.PropertyStore.get called with the following args: ',
          args,
        );

        return args;
      },
    }),
    OnChange: this.createProxy({
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
    window.OB = window.OB || this.OB;
    window.isc = window.isc || this.isc;
    window.Metadata = window.Metadata || this;
  }

  private static hasValidCache(windowId: Etendo.WindowId) {
    if (this.cache[windowId]?.data) {
      return (
        Date.now() - this.cache[windowId].updatedAt < Metadata.CACHE_DURATION
      );
    }

    return false;
  }

  // TODO: Remove empty object and update with the right value
  public static standardWindow = {};

  public static async getWindow(
    windowId: Etendo.WindowId,
  ): Promise<Etendo.WindowMetadata> {
    this.setup();

    if (this.hasValidCache(windowId)) {
      return this.cache[windowId].data;
    }

    try {
      const response = await this.client.get(`View?viewId=_${windowId}`);
      const script = document.createElement('script');

      script.type = 'text/javascript';
      script.textContent = response.data;
      document.head.appendChild(script);
      document.head.removeChild(script);

      this.cache[windowId] = {
        updatedAt: Date.now(),
        data: this.isc.classes[`_${windowId}`],
      };

      return this.cache[windowId].data;
    } catch (error) {
      throw new Error(
        `Error fetching metadata for window ${windowId}:\n${(error as Error).message}`,
      );
    }
  }

  public static async getColumns(windowId: string) {
    const metadata = await this.getWindow(windowId);

    return metadata.properties.viewProperties.fields.map(field => ({
      name: field.name,
      targetEntity: field.targetEntity,
    }));
  }
}
