import { useState, useMemo, useEffect } from "react";

// Debounce delay in ms
const DEFAULT_DEBOUNCE_DELAY = 500;

interface UseSearchOptions<T> {
  data: T[];
  filterFn: (item: T, term: string) => boolean;
  delay?: number;
}

export function useSearch<T>({
  data,
  filterFn,
  delay = DEFAULT_DEBOUNCE_DELAY,
}: UseSearchOptions<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debouncing Effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay]);

  // Client-Side Filter
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchTerm.trim()) return data;

    return data.filter((item) => filterFn(item, searchTerm));
  }, [data, searchTerm, filterFn]);

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    filteredData,
  };
}
