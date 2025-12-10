import React, { useEffect, useRef } from "react";
import { type MRT_TableInstance } from "material-react-table";
import { type EntityData } from "@workspaceui/api-client/src/api/types";
import { type SummaryType } from "./HeaderContextMenu";

interface SummaryRowProps {
  table: MRT_TableInstance<EntityData>;
  summaryState: Record<string, SummaryType>;
  summaryResult: Record<string, number | string>;
  isSummaryLoading: boolean;
  tableContainerRef: React.RefObject<HTMLDivElement>;
}

export const SummaryRow: React.FC<SummaryRowProps> = ({
  table,
  summaryState,
  summaryResult,
  isSummaryLoading,
  tableContainerRef,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const visibleColumns = table.getVisibleLeafColumns();

  // Sync scroll with table container
  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const rowContainer = rowRef.current;

    if (!tableContainer || !rowContainer) return;

    // Find any element with overflow-x
    const allDivs = tableContainer.querySelectorAll('div');
    let scrollableElement: HTMLElement | null = null;
    
    allDivs.forEach((div) => {
      const style = window.getComputedStyle(div);
      if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
        if (!scrollableElement) {
          scrollableElement = div as HTMLElement;
        }
      }
    });
    
    if (!scrollableElement) {
      scrollableElement = tableContainer;
    }

    const handleScroll = () => {
      if (rowContainer) {
        rowContainer.scrollLeft = scrollableElement!.scrollLeft;
      }
    };

    scrollableElement.addEventListener("scroll", handleScroll);
    
    // Initial sync
    handleScroll();

    return () => {
      scrollableElement!.removeEventListener("scroll", handleScroll);
    };
  }, [tableContainerRef]);

  if (Object.keys(summaryState).length === 0) {
    return null;
  }

  return (
    <div
      ref={rowRef}
      className="flex overflow-hidden border-t border-gray-200 bg-gray-50 w-full min-h-[40px]"
      style={{
        // Match the table width logic if needed, but usually flex + widths works
        minWidth: "100%",
      }}>
      {visibleColumns.map((column) => {
        const columnId = column.id;
        const summaryType = summaryState[columnId];
        const result = summaryResult[columnId];

        // Get width from column definition
        const width = column.getSize();

        let displayValue: React.ReactNode = null;

        if (summaryType) {
          if (isSummaryLoading) {
            displayValue = "Loading...";
          } else if (result !== null && result !== undefined) {
            displayValue = result;
          }
        }

        return (
          <div
            key={column.id}
            className="flex items-center px-4 py-2 flex-shrink-0 border-r border-gray-200 last:border-r-0 overflow-hidden"
            style={{
              width: width,
              minWidth: width,
              maxWidth: width,
            }}
          >
            {summaryType && (
              <div className="flex items-center font-bold text-xs overflow-hidden w-full">
                 <span className="mr-2 text-(--color-neutral-60) uppercase flex-shrink-0">{summaryType}:</span>
                 <span className="text-(--color-neutral-90) truncate">{displayValue}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
