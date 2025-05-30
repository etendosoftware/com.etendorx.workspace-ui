import { useContext } from "react";
import { SelectContext } from "@/contexts/selected";

export const useSelected = () => {
  const graph = useContext(SelectContext);

  if (!graph) throw new Error("useSelected must be used within a SelectedProvider");

  return graph;
};
