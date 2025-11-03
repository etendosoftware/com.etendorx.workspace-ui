import { useState, useCallback, useEffect, useMemo, memo } from "react";

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
  adMenuName: string;
  id: string;
  name: string;
}

export interface LinkedItemsProps {
  windowId: string;
  entityName: string;
  recordId: string;
  onFetchCategories: (params: { windowId: string; entityName: string; recordId: string }) => Promise<
    LinkedItemCategory[]
  >;
  onFetchItems: (params: {
    windowId: string;
    entityName: string;
    recordId: string;
    adTabId: string;
    tableName: string;
    columnName: string;
  }) => Promise<LinkedItem[]>;
  onItemClick: (item: LinkedItem) => void;
  loadingText: string;
  noCategoriesText: string;
  noSelectedCategoryText: string;
}

export const LinkedItems = memo(
  ({
    windowId,
    entityName,
    recordId,
    onFetchCategories,
    onFetchItems,
    onItemClick,
    loadingText,
    noCategoriesText,
    noSelectedCategoryText,
  }: LinkedItemsProps) => {
    const [categories, setCategories] = useState<LinkedItemCategory[]>([]);
    const [items, setItems] = useState<LinkedItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<LinkedItemCategory | null>(null);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);

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

    const handleItemClick = useCallback(
      (item: LinkedItem) => {
        onItemClick(item);
      },
      [onItemClick]
    );

    useEffect(() => {
      let isMounted = true;

      const fetchCategories = async () => {
        setLoadingCategories(true);

        try {
          const result = await onFetchCategories({ windowId, entityName, recordId });

          if (isMounted) {
            setCategories(result);
          }
        } catch (error) {
          console.error("Error loading categories:", error);
        } finally {
          if (isMounted) {
            setLoadingCategories(false);
          }
        }
      };

      fetchCategories();

      return () => {
        isMounted = false;
      };
    }, [windowId, entityName, recordId, onFetchCategories]);

    const loadingContent = useMemo(
      () => (
        <div className="flex justify-center items-center h-full p-4">
          <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 ml-2">{loadingText}</p>
        </div>
      ),
      [loadingText]
    );

    const noCategoriesContent = useMemo(
      () => (
        <div className="p-4">
          <p className="text-sm text-gray-500">{noCategoriesText}</p>
        </div>
      ),
      [noCategoriesText]
    );

    const noSelectedCategoryContent = useMemo(
      () => (
        <div className="flex justify-center items-center h-full p-4">
          <p className="text-sm text-gray-500">{noSelectedCategoryText}</p>
        </div>
      ),
      [noSelectedCategoryText]
    );

    const categoriesContent = useMemo(
      () => (
        <div>
          {categories.map((category) => (
            <button
              type="button"
              key={`${category.adTabId}-${category.tableName}`}
              onClick={() => handleCategoryClick(category)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleCategoryClick(category);
                }
              }}
              tabIndex={0}
              className={`p-4 cursor-pointer border-b border-gray-200 ${
                selectedCategory?.adTabId === category.adTabId ? "bg-gray-100" : "bg-transparent"
              } hover:bg-gray-50`}>
              <p className="text-sm font-medium">{category.fullElementName}</p>
              <p className="text-xs text-gray-500">
                ({category.total} {Number.parseInt(category.total) === 1 ? "item" : "items"})
              </p>
            </button>
          ))}
        </div>
      ),
      [categories, selectedCategory?.adTabId, handleCategoryClick]
    );

    const itemsContent = useMemo(
      () => (
        <div>
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleItemClick(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleItemClick(item);
                }
              }}
              className="p-4 cursor-pointer border-b border-gray-200 hover:bg-gray-50">
              <p className="text-sm text-blue-600 hover:underline">{item.name}</p>
            </div>
          ))}
        </div>
      ),
      [items, handleItemClick]
    );

    const leftPanelContent = useMemo(() => {
      if (loadingCategories) return loadingContent;
      if (categories.length === 0) return noCategoriesContent;
      return categoriesContent;
    }, [loadingCategories, categories.length, loadingContent, noCategoriesContent, categoriesContent]);

    const rightPanelContent = useMemo(() => {
      if (!selectedCategory) return noSelectedCategoryContent;
      if (loadingItems) return loadingContent;
      if (items.length === 0) return noCategoriesContent;
      return itemsContent;
    }, [
      selectedCategory,
      loadingItems,
      items.length,
      noSelectedCategoryContent,
      loadingContent,
      noCategoriesContent,
      itemsContent,
    ]);

    return (
      <div className="flex gap-4 h-[400px]">
        {/* Left Panel - Categories */}
        <div className="flex-1 border border-gray-300 rounded overflow-auto bg-white">{leftPanelContent}</div>
        {/* Right Panel - Items */}
        <div className="flex-1 border border-gray-300 rounded overflow-auto bg-white">{rightPanelContent}</div>
      </div>
    );
  }
);

LinkedItems.displayName = "LinkedItems";

export default LinkedItems;
