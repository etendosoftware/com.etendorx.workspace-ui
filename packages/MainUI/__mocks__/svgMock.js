const React = require("react");

function MockSVG(props) {
  return React.createElement("svg", {
    ...props,
    "data-testid": "mock-svg"
  });
}

module.exports = MockSVG;
module.exports.default = MockSVG;