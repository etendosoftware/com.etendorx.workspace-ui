const React = require("react");
module.exports = function MockIconButton({ children, className }) {
  return React.createElement("div", { className, "data-testid": "icon-button" }, children);
};