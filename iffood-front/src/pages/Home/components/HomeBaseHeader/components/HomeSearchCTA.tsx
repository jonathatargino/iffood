import { Search } from "lucide-react";
import { useNavigate } from "react-router";

export function HomeSearchCTA() {
  const navigate = useNavigate();

  const handleSearchClick = () => {
    navigate("/busca");
  };

  return (
    <button
      onClick={handleSearchClick}
      className="flex w-full items-center gap-3 rounded-lg bg-white px-5 py-4 shadow-xl transition-shadow hover:shadow-2xl active:scale-[0.98]"
    >
      <Search className="h-5 w-5 text-gray-400" />
      <span className="text-sm text-gray-400">
        Buscar pratos e restaurantes...
      </span>
    </button>
  );
}
