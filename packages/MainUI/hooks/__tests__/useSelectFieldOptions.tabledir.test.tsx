import type React from "react";
import { render, screen } from "@testing-library/react";
import { useSelectFieldOptions } from "@/hooks/useSelectFieldOptions";
import { FormProvider, useForm } from "react-hook-form";

const TestComp = ({ field, records }: any) => {
  const options = useSelectFieldOptions(field, records);
  return (
    <div>
      <div data-testid="count">{options.length}</div>
      {options.map((opt: any) => (
        <div key={opt.id} data-testid={`option-${opt.id}`}>
          {opt.label}
        </div>
      ))}
    </div>
  );
};

describe("useSelectFieldOptions - TableDir without selector", () => {
  it("uses default idKey='id' and identifierKey='_identifier' when selector is undefined", () => {
    const field = {
      hqlName: "table",
      // selector is undefined - simulating TableDir field without selector
      column: { reference: 19 },
    } as any;

    const records = [
      { id: "REC1", _identifier: "Table 1", name: "table1" },
      { id: "REC2", _identifier: "Table 2", name: "table2" },
    ];

    const Wrapper: React.FC = ({ children }) => {
      const methods = useForm({
        defaultValues: {
          table: "REC1",
          table$_identifier: "Table 1",
        },
      });
      return <FormProvider {...methods}>{children}</FormProvider>;
    };

    render(
      <Wrapper>
        <TestComp field={field} records={records} />
      </Wrapper>
    );

    expect(screen.getByTestId("count").textContent).toBe("2");
    expect(screen.getByTestId("option-REC1").textContent).toBe("Table 1");
    expect(screen.getByTestId("option-REC2").textContent).toBe("Table 2");
  });

  it("uses selector values when selector is defined", () => {
    const field = {
      hqlName: "emailProcess",
      selector: { valueField: "id", displayField: "_identifier" },
    } as any;

    const records = [
      { id: "PROC1", _identifier: "Process 1" },
      { id: "PROC2", _identifier: "Process 2" },
    ];

    const Wrapper: React.FC = ({ children }) => {
      const methods = useForm({
        defaultValues: {
          emailProcess: "PROC1",
          emailProcess$_identifier: "Process 1",
        },
      });
      return <FormProvider {...methods}>{children}</FormProvider>;
    };

    render(
      <Wrapper>
        <TestComp field={field} records={records} />
      </Wrapper>
    );

    expect(screen.getByTestId("count").textContent).toBe("2");
  });

  it("includes current value even if missing from records", () => {
    const field = {
      hqlName: "table",
      // No selector
    } as any;

    const records = [{ id: "REC1", _identifier: "Table 1" }];

    const Wrapper: React.FC = ({ children }) => {
      const methods = useForm({
        defaultValues: {
          table: "REC2",
          table$_identifier: "Table 2 (missing)",
        },
      });
      return <FormProvider {...methods}>{children}</FormProvider>;
    };

    render(
      <Wrapper>
        <TestComp field={field} records={records} />
      </Wrapper>
    );

    // Should have both the record from API and the current value
    expect(screen.getByTestId("count").textContent).toBe("2");
    expect(screen.getByTestId("option-REC1").textContent).toBe("Table 1");
    expect(screen.getByTestId("option-REC2").textContent).toBe("Table 2 (missing)");
  });
});
