import { render, screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { EncryptedSelector } from "../EncryptedSelector";
import type { Field } from "@workspaceui/api-client/src/api/types";

jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({ language: "en_US" }),
}));

const makeField = (overrides: Partial<Field> = {}): Field =>
  ({
    id: "fld-encrypted-1",
    name: "Secret",
    hqlName: "secret",
    columnName: "secret",
    isMandatory: false,
    column: { reference: "C5C21C28B39E4683A91779F16C112E40", length: "60", displayEncription: true },
    ...overrides,
  }) as unknown as Field;

const Wrapper = ({
  isReadOnly,
  deencryptable,
  defaultValue = "",
  field,
}: {
  isReadOnly: boolean;
  deencryptable: boolean;
  defaultValue?: string;
  field?: Field;
}) => {
  const methods = useForm({ defaultValues: { secret: defaultValue } });
  return (
    <FormProvider {...methods}>
      <EncryptedSelector field={field ?? makeField()} isReadOnly={isReadOnly} deencryptable={deencryptable} />
    </FormProvider>
  );
};

describe("EncryptedSelector", () => {
  describe("read-only mode", () => {
    it("renders the masked sentinel regardless of the underlying value", () => {
      render(<Wrapper isReadOnly={true} deencryptable={true} defaultValue="real-secret" />);

      expect(screen.getByLabelText("encrypted field")).toBeInTheDocument();
      expect(screen.getByTestId("EncryptedSelector__masked__fld-encrypted-1")).toBeInTheDocument();
      expect(screen.queryByDisplayValue("real-secret")).not.toBeInTheDocument();
    });

    it("uses field.id in the masked data-testid so multiple encrypted fields are distinguishable", () => {
      const customField = makeField({ id: "another-id" });
      render(<Wrapper isReadOnly={true} deencryptable={false} field={customField} />);
      expect(screen.getByTestId("EncryptedSelector__masked__another-id")).toBeInTheDocument();
    });

    it("ignores deencryptable in read-only mode (no toggle ever rendered)", () => {
      render(<Wrapper isReadOnly={true} deencryptable={true} defaultValue="real-secret" />);
      expect(screen.queryByTestId(/eye-toggle/)).not.toBeInTheDocument();
    });
  });

  describe("edit mode", () => {
    it("delegates to PasswordSelector with toggle when deencryptable=true", () => {
      render(<Wrapper isReadOnly={false} deencryptable={true} defaultValue="real-secret" />);

      const input = screen.getByDisplayValue("real-secret");
      expect(input).toHaveAttribute("type", "password");
      // Eye toggle visible — PasswordSelector renders it when showToggle is true and value is set.
      expect(screen.getByTestId(/eye-toggle/)).toBeInTheDocument();
    });

    it("hides the eye toggle when deencryptable=false", () => {
      render(<Wrapper isReadOnly={false} deencryptable={false} defaultValue="real-secret" />);

      const input = screen.getByDisplayValue("real-secret");
      expect(input).toHaveAttribute("type", "password");
      expect(screen.queryByTestId(/eye-toggle/)).not.toBeInTheDocument();
    });

    it("does not render the masked sentinel in edit mode", () => {
      render(<Wrapper isReadOnly={false} deencryptable={true} defaultValue="" />);
      expect(screen.queryByLabelText("encrypted field")).not.toBeInTheDocument();
    });
  });
});
