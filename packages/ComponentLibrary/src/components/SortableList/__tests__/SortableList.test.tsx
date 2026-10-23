import { render, screen } from "@testing-library/react";
import { SortableList } from "../index";

interface Row {
  id: string;
  label: string;
}

const rows: Row[] = [
  { id: "a", label: "Alpha" },
  { id: "b", label: "Beta" },
  { id: "c", label: "Gamma" },
];

describe("SortableList", () => {
  it("renders the rows in the given order", () => {
    render(
      <SortableList
        items={rows}
        onReorder={jest.fn()}
        renderItem={(row) => <span data-testid="row">{row.label}</span>}
      />
    );

    expect(screen.getAllByTestId("row").map((el) => el.textContent)).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  it("gives every row what it needs to start a drag", () => {
    const handles: Array<{ listeners: unknown; isDragging: boolean }> = [];
    render(
      <SortableList
        items={rows}
        onReorder={jest.fn()}
        renderItem={(row, handle) => {
          handles.push({ listeners: handle.listeners, isDragging: handle.isDragging });
          return (
            <button type="button" ref={handle.setActivatorNodeRef} {...handle.attributes} {...handle.listeners}>
              {row.label}
            </button>
          );
        }}
      />
    );

    expect(screen.getAllByRole("button")).toHaveLength(3);
    expect(handles.every((handle) => handle.isDragging === false)).toBe(true);
    expect(handles.every((handle) => handle.listeners !== undefined)).toBe(true);
  });

  it("renders nothing for an empty list", () => {
    render(<SortableList items={[]} onReorder={jest.fn()} renderItem={() => <span>row</span>} data-testid="list" />);

    expect(screen.getByTestId("list")).toBeEmptyDOMElement();
  });

  it("does not report a new order until a row is dropped somewhere else", () => {
    const onReorder = jest.fn();

    render(<SortableList items={rows} onReorder={onReorder} renderItem={(row) => <span>{row.label}</span>} />);

    expect(onReorder).not.toHaveBeenCalled();
  });
});
