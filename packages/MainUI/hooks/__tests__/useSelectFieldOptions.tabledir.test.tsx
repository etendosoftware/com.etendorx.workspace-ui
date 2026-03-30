import { render, screen } from "@testing-library/react";
import { useSelectFieldOptions } from "@/hooks/useSelectFieldOptions";
import {
  FormContextWrapper,
  createFieldMock,
  createRecordMock,
  createDefaultFormValues,
} from "../__test-helpers__/useSelectFieldOptions.helpers";

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
    const field = createFieldMock();
    const records = [
      createRecordMock("REC1", "Table 1", { name: "table1" }),
      createRecordMock("REC2", "Table 2", { name: "table2" }),
    ];

    render(
      <FormContextWrapper defaultValues={createDefaultFormValues("table", "REC1", "Table 1")}>
        <TestComp field={field} records={records} />
      </FormContextWrapper>
    );

    expect(screen.getByTestId("count").textContent).toBe("2");
    expect(screen.getByTestId("option-REC1").textContent).toBe("Table 1");
    expect(screen.getByTestId("option-REC2").textContent).toBe("Table 2");
  });

  it("uses selector values when selector is defined", () => {
    const field = createFieldMock({
      hqlName: "emailProcess",
      selector: { valueField: "id", displayField: "_identifier" },
    });
    const records = [
      createRecordMock("PROC1", "Process 1"),
      createRecordMock("PROC2", "Process 2"),
    ];

    render(
      <FormContextWrapper defaultValues={createDefaultFormValues("emailProcess", "PROC1", "Process 1")}>
        <TestComp field={field} records={records} />
      </FormContextWrapper>
    );

    expect(screen.getByTestId("count").textContent).toBe("2");
  });

  it("includes current value even if missing from records", () => {
    const field = createFieldMock();
    const records = [createRecordMock("REC1", "Table 1")];

    render(
      <FormContextWrapper defaultValues={createDefaultFormValues("table", "REC2", "Table 2 (missing)")}>
        <TestComp field={field} records={records} />
      </FormContextWrapper>
    );

    // Should have both the record from API and the current value
    expect(screen.getByTestId("count").textContent).toBe("2");
    expect(screen.getByTestId("option-REC1").textContent).toBe("Table 1");
    expect(screen.getByTestId("option-REC2").textContent).toBe("Table 2 (missing)");
  });
});
