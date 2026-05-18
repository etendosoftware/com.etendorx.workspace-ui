// packages/MainUI/components/ProcessModal/__tests__/useSharedMocks.ts

jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: () => ({ session: { contextValue: "test" } }),
}));

jest.mock("../../selectors/GenericSelector", () => {
  const React = require("react");
  return function MockGenericSelector({ parameter, readOnly }: any) {
    return React.createElement("input", {
      "data-testid": "generic-field",
      name: parameter?.name,
      readOnly: readOnly,
      disabled: readOnly,
    });
  };
});

jest.mock("@/components/Label", () => {
  const React = require("react");
  return function MockLabel({ name }: any) {
    return React.createElement("div", {
      "data-testid": "field-label",
      children: name,
    });
  };
});

jest.mock("@/components/Form/FormView/selectors/BaseSelector", () => ({
  compileExpression: (expression: string) => (session: any, values: any) => {
    if (expression === "@testContext@ == 'test'") return true;
    if (expression === "@testContext@ == 'fail'") return false;
    if (expression === "@testContext@ == 'readonly'") return true;
    if (expression === "@testContext@ == 'editable'") return false;
    if (expression === "true") return true;
    if (expression === "false") return false;
    return true;
  },
}));
