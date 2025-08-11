import type React from "react";
import { render, screen } from "@testing-library/react";
import { useSelectFieldOptions } from "@/hooks/useSelectFieldOptions";
import { FormProvider, useForm } from "react-hook-form";

const TestComp = ({ field, records }: any) => {
  const options = useSelectFieldOptions(field, records);
  return <div data-testid="count">{options.length}</div>;
};

describe("useSelectFieldOptions entries injection", () => {
  it("prefers injected entries over remote records", () => {
    const field = {
      hqlName: "cTaxId",
      selector: { valueField: "id", displayField: "_identifier" },
      column: { reference: 30, referenceSearchKey: 0, referenceSearchKey$_identifier: "" },
    } as any;

    const Wrapper: React.FC = ({ children }) => {
      const methods = useForm({
        defaultValues: {
          cTaxId: "TAX1",
          "cTaxId$_identifier": "Tax 1",
          "cTaxId$_entries": [
            { id: "TAX1", label: "Tax 1" },
            { id: "TAX2", label: "Tax 2" },
          ],
        },
      });
      return <FormProvider {...methods}>{children}</FormProvider>;
    };

    render(
      <Wrapper>
        <TestComp field={field} records={[]} />
      </Wrapper>
    );

    expect(screen.getByTestId("count").textContent).toBe("2");
  });
});

