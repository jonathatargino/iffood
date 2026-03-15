import { useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { storeService } from "@/services/store";
import { ProductForm } from ".";

export function ProductPage() {
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
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-4 border-[#FF7622] border-t-transparent" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!actualStoreId) {
    navigate("/loja/minha-loja");
    return null;
  }

  return <ProductForm storeId={actualStoreId} />;
}
