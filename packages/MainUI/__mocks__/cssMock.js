// Mock for CSS imports in Jest
// Returns an empty object that can be used as CSS modules
module.exports = new Proxy({}, {
  get: function getter(target, key) {
    if (key === '__esModule') {
      return false;
    }
    if (key === 'default') {
      return {};
    }
    return key;
  },
});
