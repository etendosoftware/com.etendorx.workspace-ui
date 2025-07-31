const React = require("react");

module.exports = function MockSVG(props) {
  return React.createElement("svg", {
    ...props,
    "data-testid": "mock-svg"
  });
};