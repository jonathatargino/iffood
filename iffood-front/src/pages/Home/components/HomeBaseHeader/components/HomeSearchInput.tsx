import { Search, X } from "lucide-react";

interface HomeSearchInputProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleClearSearch: () => void;
}

export function HomeSearchInput({
  handleClearSearch,
  searchQuery,
  setSearchQuery,
}: HomeSearchInputProps) {
  return (
    <div className="flex h-[52px] items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-xl">
      <Search className="h-5 w-5 flex-shrink-0 text-gray-400" />
      <input
        type="text"
        placeholder="Buscar pratos e restaurantes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-1 text-sm text-[#2e2e2e] outline-none placeholder:text-gray-400"
        autoFocus
      />
      {searchQuery && (
        <button
          onClick={handleClearSearch}
          className="flex-shrink-0 rounded-full bg-gray-200 p-1.5 transition-colors hover:bg-gray-300 active:scale-95"
        >
          <X className="h-3.5 w-3.5 text-gray-600" />
        </button>
      )}
    </div>
  );
}
