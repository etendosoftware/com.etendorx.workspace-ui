/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { Breadcrumbs, Button, Box } from "@mui/material";
import { type FC, useRef } from "react";
import { useStyle } from "../styles";
import type { BreadcrumbListProps } from "../types";
import { useBreadcrumbOverflow } from "../useBreadcrumbOverflow";
import BreadcrumbItem from "../BreadcrumbItem/index";

// Wraps the first breadcrumb item + its trailing slot (`afterFirstItem`) in a single MUI
// Breadcrumbs child so the separator is NOT inserted between them.
const FIRST_ITEM_WRAPPER_SX = { display: "flex", alignItems: "center" } as const;

const BreadcrumbList: FC<BreadcrumbListProps> = ({
  items,
  handleActionMenuOpen,
  handleHomeNavigation,
  onCollapseMenuOpen,
  onBackClick,
  afterFirstItem,
  separator,
}) => {
  const { sx } = useStyle();
  const containerRef = useRef<HTMLElement | null>(null);
  const { visibleItemsWithIndex, collapsedItems, isCollapsed } = useBreadcrumbOverflow({
    containerRef,
    items,
  });

  if (visibleItemsWithIndex.length === 0) {
    return null;
  }

  if (items.length <= 2) {
    return (
      <Breadcrumbs separator={separator} aria-label="breadcrumb" sx={sx.breadcrumbs}>
        {items.map((item, index) => (
          <Box key={item.id} sx={FIRST_ITEM_WRAPPER_SX}>
            <BreadcrumbItem
              item={item}
              position={index}
              breadcrumbsSize={items.length}
              handleActionMenuOpen={handleActionMenuOpen}
              handleHomeNavigation={handleHomeNavigation}
              onBackClick={onBackClick}
            />
            {index === 0 && afterFirstItem}
          </Box>
        ))}
      </Breadcrumbs>
    );
  }

  const [firstEntry, ...restEntries] = visibleItemsWithIndex;

  return (
    <Breadcrumbs ref={containerRef} separator={separator} aria-label="breadcrumb" sx={sx.breadcrumbs}>
      {/* First item + favorite slot grouped so MUI does not insert a separator between them */}
      <Box key={firstEntry.item.id} sx={FIRST_ITEM_WRAPPER_SX}>
        <BreadcrumbItem
          item={firstEntry.item}
          position={firstEntry.originalIndex}
          breadcrumbsSize={items.length}
          handleActionMenuOpen={handleActionMenuOpen}
          handleHomeNavigation={handleHomeNavigation}
          onBackClick={onBackClick}
        />
        {afterFirstItem}
      </Box>

      {/* Ellipsis button as a standalone breadcrumb entry when collapsed */}
      {isCollapsed && (
        <Button
          key="collapse-button"
          sx={sx.collapseButton}
          onClick={(e) => onCollapseMenuOpen?.(e, collapsedItems)}
          aria-label="Show hidden breadcrumb items">
          ...
        </Button>
      )}

      {/* Middle and last visible items */}
      {restEntries.map(({ item, originalIndex }) => (
        <BreadcrumbItem
          key={item.id}
          item={item}
          position={originalIndex}
          breadcrumbsSize={items.length}
          handleActionMenuOpen={handleActionMenuOpen}
          handleHomeNavigation={handleHomeNavigation}
          onBackClick={onBackClick}
        />
      ))}
    </Breadcrumbs>
  );
};

export default BreadcrumbList;
