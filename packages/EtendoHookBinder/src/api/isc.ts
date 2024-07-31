function createProxy(obj) {
  return new Proxy(obj, {
    get(target, prop) {
      if (!(prop in target)) {
        target[prop] = {};
        target[prop] = createProxy(target[prop]);
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
    window.OB = OB;
    console.log('setup ISC done');
  } else {
    console.log('rehusing ISC instance');
  }
}

