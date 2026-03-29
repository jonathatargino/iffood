import { FilterOptionButton } from "./FilterOptionButton";

interface SearchTypeOptionsProps {
  searchType: "stores" | "products";
  handleSearchTypeChange: (type: "stores" | "products") => void;
}

export function SearchTypeOptions({
  searchType,
  handleSearchTypeChange,
}: SearchTypeOptionsProps) {
  return (
    <div className="mb-5 flex gap-3">
      <FilterOptionButton
        onClick={() => handleSearchTypeChange("stores")}
        isActive={searchType === "stores"}
      >
        Restaurantes
      </FilterOptionButton>
      <FilterOptionButton
        onClick={() => handleSearchTypeChange("products")}
        isActive={searchType === "products"}
      >
        Pratos
      </FilterOptionButton>
    </div>
  );
}
