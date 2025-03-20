// hooks/mocks/useTableDirDatasource.ts
import { useState, useCallback } from 'react';

export const useMockTableDirDatasource = ({ pageSize = 20, initialPageSize = 20 }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Genera registros simulados según el número de página
  const generateMockRecords = (page, size) => {
    const result = [];
    const start = page * size;
    const end = start + size;

    for (let i = start; i < end && i < 1000; i++) {
      result.push({
        id: `id-${i}`,
        name: `Option ${i + 1}`,
      });
    }

    return result;
  };

  const fetch = useCallback(
    (_, reset = false) => {
      setLoading(true);

      // Simula una petición con un timeout
      setTimeout(() => {
        if (reset) {
          setCurrentPage(0);
          const initialRecords = generateMockRecords(0, initialPageSize);
          setRecords(initialRecords);
          setHasMore(initialRecords.length >= initialPageSize);
        } else {
          const newRecords = generateMockRecords(currentPage + 1, pageSize);
          setRecords(prev => [...prev, ...newRecords]);
          setCurrentPage(prev => prev + 1);
          setHasMore(newRecords.length >= pageSize && (currentPage + 1) * pageSize < 1000);
        }

        setLoading(false);
      }, 500); // Simula 500ms de latencia
    },
    [currentPage, pageSize, initialPageSize],
  );

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetch(null);
    }
  }, [fetch, loading, hasMore]);

  return {
    records,
    loading,
    error: null,
    refetch: (reset = true) => fetch(null, reset),
    loadMore,
    hasMore,
  };
};
