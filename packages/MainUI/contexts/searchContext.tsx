import { createContext, useContext, useMemo, useState } from "react";

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SearchContext = createContext<SearchContextType>({} as SearchContextType);

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const value = useMemo(() => ({ searchQuery, setSearchQuery }), [searchQuery]);

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearch = () => useContext(SearchContext);
