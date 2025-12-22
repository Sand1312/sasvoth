import { useState } from "react";
import { Poll, PollStatus } from "@/types/polls";
import { usePollsQuery } from "./usePolls";
import { useSearch } from "./useSearch";

export const usePollSearch = (initialStatus: PollStatus = PollStatus.InProgress) => {
  const [pollStatusTab, setPollStatusTab] = useState<PollStatus>(initialStatus);

  const {
    data: activePolls = [],
    isLoading,
    error,
    refetch,
  } = usePollsQuery(pollStatusTab);

  const {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    filteredData: filteredPolls,
  } = useSearch<Poll>({
    data: activePolls,
    filterFn: (poll, term) => {
      const lowerTerm = term.toLowerCase();
      return Boolean(
        poll.title.toLowerCase().includes(lowerTerm) ||
        (poll.description && poll.description.toLowerCase().includes(lowerTerm))
      );
    },
  });

  return {
    searchTerm,
    setSearchTerm,
    pollStatusTab,
    setPollStatusTab,
    filteredPolls,
    isLoading,
    error,
    refetch,
    debouncedSearchTerm,
  };
};
