import { HomeBaseHeader } from "../../components/HomeBaseHeader";
import { HomeSearchInput } from "../../components/HomeBaseHeader/components/HomeSearchInput";

interface SearchPageHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleClearSearch: () => void;
}

export function SearchPageHeader({
  searchQuery,
  setSearchQuery,
  handleClearSearch,
}: SearchPageHeaderProps) {
  return (
    <HomeBaseHeader
      children={
        <HomeSearchInput
          handleClearSearch={handleClearSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      }
    />
  );
}
