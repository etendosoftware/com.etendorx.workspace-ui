export const onChange =
  (caller: string) =>
  (item: unknown, view: unknown, form: unknown, grid: unknown) => {
    console.debug(caller, { item, view, form, grid });
  };
