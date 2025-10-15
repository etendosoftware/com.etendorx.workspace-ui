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

import { useState, useCallback } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";

export interface LinkedItemCategory {
  adTabId: string;
  adWindowId: string;
  columnName: string;
  fullElementName: string;
  tableName: string;
  total: string;
}

export interface LinkedItem {
  adTabId: string;
  adWindowId: string;
  id: string;
  name: string;
}

export interface LinkedItemsProps {
  windowId: string;
  entityName: string;
  recordId: string;
  onFetchCategories: (params: { windowId: string; entityName: string; recordId: string }) => Promise<LinkedItemCategory[]>;
  onFetchItems: (params: {
    windowId: string;
    entityName: string;
    recordId: string;
    adTabId: string;
    tableName: string;
    columnName: string;
  }) => Promise<LinkedItem[]>;
  onItemClick: (item: LinkedItem) => void;
}

export const LinkedItems = ({
  windowId,
  entityName,
  recordId,
  onFetchCategories,
  onFetchItems,
  onItemClick,
}: LinkedItemsProps) => {
  const [categories, setCategories] = useState<LinkedItemCategory[]>([]);
  const [items, setItems] = useState<LinkedItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<LinkedItemCategory | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const loadCategories = useCallback(async () => {
    if (initialized) return;

    setLoadingCategories(true);
    try {
      const result = await onFetchCategories({ windowId, entityName, recordId });
      setCategories(result);
      setInitialized(true);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  }, [windowId, entityName, recordId, onFetchCategories, initialized]);

  const handleCategoryClick = useCallback(
    async (category: LinkedItemCategory) => {
      setSelectedCategory(category);
      setLoadingItems(true);
      try {
        const result = await onFetchItems({
          windowId,
          entityName,
          recordId,
          adTabId: category.adTabId,
          tableName: category.tableName,
          columnName: category.columnName,
        });
        setItems(result);
      } catch (error) {
        console.error("Error loading items:", error);
      } finally {
        setLoadingItems(false);
      }
    },
    [windowId, entityName, recordId, onFetchItems]
  );

  // Load categories when component mounts
  if (!initialized && !loadingCategories) {
    loadCategories();
  }

  return (
    <Box sx={{ display: "flex", gap: 2, height: "400px" }}>
      {/* Left Panel - Categories */}
      <Box
        sx={{
          flex: 1,
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
          overflow: "auto",
          backgroundColor: "#fff",
        }}>
        {loadingCategories ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : categories.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No linked items found
            </Typography>
          </Box>
        ) : (
          <Box>
            {categories.map((category) => (
              <Box
                key={`${category.adTabId}-${category.tableName}`}
                onClick={() => handleCategoryClick(category)}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  borderBottom: "1px solid #f0f0f0",
                  backgroundColor: selectedCategory?.adTabId === category.adTabId ? "#f5f5f5" : "transparent",
                  "&:hover": {
                    backgroundColor: "#fafafa",
                  },
                }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {category.fullElementName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({category.total} {Number.parseInt(category.total) === 1 ? "item" : "items"})
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Right Panel - Items */}
      <Box
        sx={{
          flex: 1,
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
          overflow: "auto",
          backgroundColor: "#fff",
        }}>
        {!selectedCategory ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Select a category to view items
            </Typography>
          </Box>
        ) : loadingItems ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No items found
            </Typography>
          </Box>
        ) : (
          <Box>
            {items.map((item) => (
              <Box
                key={item.id}
                onClick={() => onItemClick(item)}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  borderBottom: "1px solid #f0f0f0",
                  "&:hover": {
                    backgroundColor: "#fafafa",
                  },
                }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: "primary.main",
                    textDecoration: "none",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}>
                  {item.name}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LinkedItems;
