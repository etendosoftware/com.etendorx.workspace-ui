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

const isc = {
  classes: {} as Etendo.ClassMap,
  ClassFactory: {
    defineClass: function (className: string, superClass: string) {
      return {
        addProperties: function (properties: unknown[]) {
          const cn = className.split('_');
          const newClassName = '_' + cn[1].toString();

          if (!isc.classes[newClassName]) {
            isc.classes[newClassName] = {
              superClass: superClass,
              properties: [],
            };
          }

          isc.classes[newClassName].properties.push(properties);

          return isc.ClassFactory;
        },
      };
    },
  },
};

const OB = createProxy({});

export function setupIsc() {
  if (!Object.prototype.hasOwnProperty.call(window, 'isc')) {
    window.isc = isc;
  }

  if (!Object.prototype.hasOwnProperty.call(window, 'OB')) {
    window.OB = OB;
  }
}
