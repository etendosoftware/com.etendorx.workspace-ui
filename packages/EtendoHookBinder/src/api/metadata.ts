import { API_METADATA_URL } from './constants';
import { newClient } from './client';
import { onChange } from './helpers';

export class Metadata {
  private static cache: Etendo.CacheStore<Etendo.WindowMetadata> = {};
  private static client = newClient(API_METADATA_URL);
  private static classes: Etendo.WindowMetadataMap = {};

  private static isc = {
    ClassFactory: {
      defineClass: (className: string, superClass: string) => {
        return {
          addProperties: (properties: Etendo.WindowMetadataProperties) => {
            const cn = className.split('_');
            const newClassName = '_' + cn[1].toString();

            if (!this.classes[newClassName]) {
              this.classes[newClassName] = {
                name: className,
                superClass: superClass,
                properties: {} as Etendo.WindowMetadataProperties,
              };
            }

            this.classes[newClassName].properties = Object.assign(
              {},
              this.classes[newClassName].properties,
              properties,
            );

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

  public static standardWindow = {};

  public static async get(
    windowId: Etendo.WindowId,
  ): Promise<Etendo.WindowMetadata> {
    this.setup();

    if (this.hasValidCache(windowId)) {
      return this.cache[windowId].data;
    }

    try {
      const response = await this.client.get(`View?viewId=_${windowId}`);

      eval(response.data);

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

  public static async getWindowFields(windowId: Etendo.WindowId) {
    const data = await this.get(windowId);

    return data.properties.viewProperties.fields;
  }

  public static async getWindow(windowId: Etendo.WindowId) {
    const {
      properties: { viewProperties, multiDocumentEnabled },
    } = await this.get(windowId);

    return {
      title: viewProperties.tabTitle,
      entity: viewProperties.entity,
      isDeleteableTable: viewProperties.isDeleteableTable,
      multiDocumentEnabled,
      fields: viewProperties.fields,
    };
  }
}
