import type { Store } from "@/services/store";
import { useNavigate } from "react-router";
import { StoreCarousel } from "./components/StoreCarousel";
import { HomeSectionHeader } from "../HomeSectionHeader";

interface StoresHomeSectionProps {
  stores: Store[];
}

export function StoresHomeSection({ stores }: StoresHomeSectionProps) {
  const navigate = useNavigate();

  const handleStoreClick = (id: string) => {
    navigate(`/loja/${id}`);
  };

  const handleViewAllStores = () => {
    navigate("/busca?type=stores");
  };

  return (
    <div>
      <HomeSectionHeader
        title="Restaurantes abertos"
        onViewAll={handleViewAllStores}
      />

      <StoreCarousel stores={stores} onClick={handleStoreClick} />
    </div>
  );
}
