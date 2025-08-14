# **PRD-05: Implementation of Virtual Scrolling for Grids**

**Status:** Proposed
**Owner:** Development Team
**Date:** 2024-07-25
**Priority:** HIGH

### **1. Problem**

Data tables and grids in Etendo WorkspaceUI often need to render hundreds or thousands of rows. The current implementation renders **all rows** in the DOM at once, regardless of whether they are visible in the user's viewport. This causes severe performance issues:

- **Excessive Memory Usage:** Each rendered row is a set of DOM nodes that consumes memory.
- **Slow Initial Rendering:** Rendering thousands of rows can block the browser's main thread for seconds, making the application feel sluggish and unresponsive.
- **Slow Interactions:** Actions like scrolling, selecting, or sorting become extremely slow because the browser has to recalculate the layout and style of a massive number of elements.

### **2. Proposed Solution**

We propose implementing **Virtual Scrolling** (or "windowing") for all data grids in the application. This technique involves rendering only the rows that are visible to the user at any given time (plus a small buffer of rows above and below) in the DOM.

We will use the **`@tanstack/react-virtual`** library, from the same ecosystem as TanStack Query, for its lightweight nature, excellent performance, and good integration with React.

As the user scrolls, the library will be responsible for recycling DOM elements, replacing the content of rows that exit the viewport with those that enter it, maintaining a very low and constant number of nodes in the DOM.

### **3. Technical Implementation**

#### **3.1. Installing the Dependency**

```bash
npm install @tanstack/react-virtual
```

#### **3.2. Creating a `VirtualizedTable` Component**

A reusable component will be created to encapsulate the virtualization logic.

```typescript
// components/Table/VirtualizedTable.tsx
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualizedTable({ rows, columns, rowHeight = 50 }: TableProps) {
const parentRef = useRef<HTMLDivElement>(null);

// Virtualization hook
const rowVirtualizer = useVirtualizer({
count: rows.length, // Total number of rows
getScrollElement: () => parentRef.current, // Element with the scrollbar
estimateSize: () => rowHeight, // Estimated height of each row
overscan: 5, // Render 5 extra items outside the viewport
});

return (
<div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
{/* Container with the total height for the scrollbar to work */}
<div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
{/* Mapping over the virtual items, not all rows */}
{rowVirtualizer.getVirtualItems().map((virtualItem) => (
<div
key={virtualItem.key}
style={{
position: 'absolute',
top: 0,
left: 0,
width: '100%',
height: `${virtualItem.size}px`,
transform: `translateY(${virtualItem.start}px)`,
}}
>
{/* Render the row component with the correct data */}
<TableRow data={rows[virtualItem.index]} columns={columns} />
</div>
))}
</div>
</div>
);
}
```

#### **3.3. Integration**

Components that currently render grids (e.g., `DatasourceGrid`) will be refactored to use the new `VirtualizedTable` component instead of a `map` over all the data.

### **4. Success Metrics**

- **Constant Number of DOM Nodes:** The number of `<tr>` (or row `div`) elements in the DOM should remain low and constant (e.g., \~20-30) regardless of whether the grid contains 100 or 10,000 rows.
- **Improved Frame Rate (FPS):** Scrolling in large grids should remain at 60 FPS, with no drops or freezes, as measured with browser performance tools.
- **Reduced Memory Usage:** A decrease of at least 80% in JS heap memory usage when displaying grids with more than 1,000 rows.

### **5. Acceptance Criteria**

- [ ] The `@tanstack/react-virtual` dependency has been added to the project.
- [ ] A generic `VirtualizedTable` component or similar has been created.
- [ ] All main grids in the application have been refactored to use virtualization.
- [ ] Scrolling is smooth, and the table renders correctly even with large volumes of data.
- [ ] Row height is consistent. If dynamic heights are required, the logic to measure them has been implemented.
- [ ] Row selection and other interactions continue to work correctly in the virtualized table.
- [ ] Documentation in `docs/components` has been updated to include the new virtualized table component.