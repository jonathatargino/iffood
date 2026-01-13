import { useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { storeService } from "@/services/store";
import { ProductForm } from "./index";

export function ProductFormWrapper() {
  const location = useLocation();
  const navigate = useNavigate();
  const storeId = location.state?.storeId;

  // If no storeId in location state, fetch from user's stores
  const { data: stores, isLoading } = useQuery({
    queryKey: ["my-store"],
    queryFn: storeService.getMyStore,
    enabled: !storeId,
  });

  const actualStoreId = storeId || stores?.[0]?.id;

  if (isLoading && !storeId) {
    return (
      <div className="bg-[#fafafa] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 border-4 border-[#FF7622] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!actualStoreId) {
    navigate("/minha-loja");
    return null;
  }

  return <ProductForm storeId={actualStoreId} />;
}
