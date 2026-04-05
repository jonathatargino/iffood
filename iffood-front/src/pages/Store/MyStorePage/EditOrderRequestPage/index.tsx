import { useEffect, useReducer, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { orderRequestService } from "@/services/order-request";
import { productService } from "@/services/product";
import { useChangeAndConcludeOrder } from "../hooks/useOrderMutation";
import { PageHeader } from "@/components/PageHeader";
import { OrderRequestInfoSection } from "./components/OrderRequestInfoSection";
import { OrderItemsEditSection } from "./components/OrderItemsEditSection";
import { EditOrderRequestBottomMenu } from "./components/EditOrderRequestBottomMenu";
import { LoadingView } from "@/views/LoadingView";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { editOrderReducer } from "./reducer";
import { getProductOptionMaxQuantitiesById } from "./utils";

type EditItem = {
  productOptionId: string;
  productName: string;
  productOptionName: string;
  productValue: number;
  quantity: number;
};

export function EditOrderRequestPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [items, dispatch] = useReducer(editOrderReducer, []);

  console.log({ items });

  const handleAddItem = useCallback(
    (item: EditItem) => {
      dispatch({
        type: "ADD_ITEM",
        payload: {
          item,
        },
      });
    },
    [dispatch],
  );

  const handleRemoveItem = useCallback(
    (productOptionId: string) => {
      dispatch({
        type: "REMOVE_ITEM",
        payload: {
          productOptionId,
        },
      });
    },
    [dispatch],
  );

  const handleUpdateQuantity = useCallback(
    (productOptionId: string, quantity: number) => {
      dispatch({
        type: "UPDATE_QUANTITY",
        payload: {
          productOptionId,
          quantity,
        },
      });
    },
    [dispatch],
  );

  const handleClearItems = useCallback(() => {
    dispatch({
      type: "CLEAR_CART",
    });
  }, [dispatch]);

  const { data: order, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => orderRequestService.getById(orderId!),
    enabled: !!orderId,
  });

  const storeId = order?.storeId;

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["store-products-all", storeId],
    queryFn: () =>
      productService.getProductsByStore(storeId, { pageSize: 100 }),
    enabled: !!storeId,
  });

  const initializeItems = useCallback(() => {
    if (isLoadingOrder) return;
    if (!order) return;

    const initialItems: EditItem[] = order.items.map((item) => ({
      productOptionId: item.productOptionId,
      productName: item.productName,
      productOptionName: item.productOptionName,
      productValue: item.productValue,
      quantity: item.quantity,
    }));

    dispatch({
      type: "INITIALIZE",
      payload: {
        items: initialItems,
      },
    });
  }, [isLoadingOrder, order]);

  useEffect(() => {
    initializeItems();
  }, [initializeItems]);

  const changeAndConcludeMutation = useChangeAndConcludeOrder(storeId ?? "");

  const handleSubmit = () => {
    if (!orderId || items.length === 0) return;
    changeAndConcludeMutation.mutate(
      {
        orderId,
        items: items.map(({ productOptionId, quantity }) => ({
          productOptionId,
          quantity,
        })),
      },
      { onSuccess: () => navigate("/loja/minha-loja") },
    );
  };

  const total = items.reduce(
    (sum, item) => sum + item.productValue * item.quantity,
    0,
  );

  const products = productsData?.data ?? [];

  const productOptionMaxQuantityMap = useMemo(() => {
    return getProductOptionMaxQuantitiesById(products);
  }, [products]);

  if (isLoadingOrder) {
    return <LoadingView />;
  }

  if (!order) {
    return <NotFoundPage />;
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      <PageHeader text="Editar Pedido" hasBackButton />
      <OrderRequestInfoSection
        order={order}
        items={items}
        total={total}
        onQuantityChange={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        productOptionMaxQuantityMap={productOptionMaxQuantityMap}
        onClearItems={handleClearItems}
      />

      <OrderItemsEditSection
        products={products}
        isLoadingProducts={isLoadingProducts}
        onAddItem={handleAddItem}
      />

      <EditOrderRequestBottomMenu
        isLoading={changeAndConcludeMutation.isPending}
        itemsCount={items.length}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default EditOrderRequestPage;
