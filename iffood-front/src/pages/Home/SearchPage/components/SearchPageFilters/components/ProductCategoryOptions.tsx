import { FilterOptionButton } from "./FilterOptionButton";

interface ProductCategoryOptionsProps {
  selectedCategory: string;
  handleCategoryChange: (category: string) => void;
}

export function ProductCategoryOptions({
  selectedCategory,
  handleCategoryChange,
}: ProductCategoryOptionsProps) {
  return (
    <div className="mb-5 flex gap-3">
      <FilterOptionButton
        onClick={() => handleCategoryChange("")}
        isActive={selectedCategory === ""}
        size="small"
      >
        Todos
      </FilterOptionButton>
      <FilterOptionButton
        onClick={() => handleCategoryChange("savory")}
        isActive={selectedCategory === "savory"}
        size="small"
      >
        Salgado
      </FilterOptionButton>
      <FilterOptionButton
        onClick={() => handleCategoryChange("sweet")}
        isActive={selectedCategory === "sweet"}
        size="small"
      >
        Doce
      </FilterOptionButton>
    </div>
  );
}
