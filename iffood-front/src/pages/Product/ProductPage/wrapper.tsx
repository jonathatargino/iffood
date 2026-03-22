import { useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { storeService } from "@/services/store";
import { ProductForm } from ".";
import { LoadingView } from "@/views/LoadingView";

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
    return <LoadingView />;
  }

  if (!actualStoreId) {
    navigate("/loja/minha-loja");
    return null;
  }

  return <ProductForm storeId={actualStoreId} />;
}

export default ProductPage;
