import { useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { storeService } from "@/services/store";
import { LoadingView } from "@/views/LoadingView";
import { ProductFormPage } from ".";

interface ProductPageProps {
  isEditing: boolean;
}

export function ProductPage({ isEditing }: ProductPageProps) {
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

  return <ProductFormPage storeId={actualStoreId} isEditing={isEditing} />;
}

export default ProductPage;
