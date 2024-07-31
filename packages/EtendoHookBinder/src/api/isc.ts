function createProxy(obj: Record<string, unknown>) {
  return new Proxy(obj, {
    get(target, prop: string) {
      if (!(prop in target)) {
        target[prop] = createProxy({});
      }
      return target[prop];
    },
  });
}

const classes: Etendo.ClassMap = {};

const isc = {
  ClassFactory: {
    defineClass: function (className: string, superClass: string) {
      return {
        addProperties: function (properties: unknown[]) {
          const cn = className.split('_');
          const newClassName = '_' + cn[1].toString();

          if (!classes[newClassName]) {
            classes[newClassName] = {
              name: className,
              superClass: superClass,
              properties: [],
            };
          }

          classes[newClassName].properties.push(properties);

          return isc.ClassFactory;
        },
      };
    },
  },
};

const OB = createProxy({
  KernelUtilities: createProxy({
    handleSystemException: function (err: unknown) {
      throw err;
    },
  }),
});

export function setup() {
  window.isc = window.isc ?? isc;
  window.OB = window.OB ?? OB;
  window.classes = window.classes ?? classes;
}
