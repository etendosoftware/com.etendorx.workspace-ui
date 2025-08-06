const React = require("react");

function MockReactMarkdown({ children, ...props }) {
  return React.createElement("div", {
    ...props,
    "data-testid": "mock-react-markdown"
  }, children);
}

module.exports = MockReactMarkdown;
module.exports.default = MockReactMarkdown;
