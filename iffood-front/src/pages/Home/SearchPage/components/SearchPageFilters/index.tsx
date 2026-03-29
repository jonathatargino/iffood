import { ProductCategoryOptions } from "./components/ProductCategoryOptions";
import { SearchTypeOptions } from "./components/SearchTypeOptions";

interface SearchPageFiltersProps {
  searchType: "stores" | "products";
  selectedCategory: string;
  handleSearchTypeChange: (type: "stores" | "products") => void;
  handleCategoryChange: (category: string) => void;
}

export function SearchPageFilters({
  searchType,
  selectedCategory,
  handleSearchTypeChange,
  handleCategoryChange,
}: SearchPageFiltersProps) {
  return (
    <div className="px-6 py-6">
      <SearchTypeOptions
        searchType={searchType}
        handleSearchTypeChange={handleSearchTypeChange}
      />

      {searchType === "products" && (
        <ProductCategoryOptions
          selectedCategory={selectedCategory}
          handleCategoryChange={handleCategoryChange}
        />
      )}
    </div>
  );
}
