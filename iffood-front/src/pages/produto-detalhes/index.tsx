import { useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { productService, type ProductOption } from "@/services/product";
import { useCart } from "@/contexts/cart/context";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { ProductImage } from "./components/ProductImage";
import { ProductInfoSection } from "./components/Sections/ProductInfoSection";
import { ProductOptionsSection } from "./components/Sections/ProductOptionsSection";
import { ProductDetailBottomBar } from "./components/ProductDetailBottomBar";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productDetailFormSchema, type ProductDetailFormData } from "./schema";

export function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const [showStoreSwitchModal, setShowStoreSwitchModal] = useState(false);
  const cart = useCart();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product-public", productId],
    queryFn: () => productService.getProductById(productId!),
    enabled: !!productId,
  });

  const addAllToCart = ({
    forceSwitchStore = false,
    productOption,
    quantity,
  }: {
    forceSwitchStore?: boolean;
    productOption: ProductOption;
    quantity: number;
  }) => {
    if (!product || !product.store) return;

    const store = {
      id: product.store.id,
      name: product.store.name,
      whatsapp: product.store.whatsapp,
    };

    if (forceSwitchStore) {
      cart.switchStoreAndAdd(
        {
          product,
          productOption,
          quantity,
        },
        store,
      );
    } else {
      cart.addItem(
        {
          product,
          productOption,
          quantity,
        },
        store,
      );
    }
  };

  const handleAddToCart = ({
    productOption,
    quantity,
  }: {
    productOption: ProductOption;
    quantity: number;
  }) => {
    if (!product || !product.store) return;

    // TODO: This logic should be moved to cart context
    if (cart.needsStoreSwitch(product.store.id)) {
      setShowStoreSwitchModal(true);
      return;
    }

    addAllToCart({ productOption, quantity });
  };

  const handleConfirmStoreSwitch = () => {
    setShowStoreSwitchModal(false);
    addAllToCart({
      forceSwitchStore: true,
      productOption: form.getValues().productOption,
      quantity: form.getValues().quantity,
    });
  };

  const form = useForm<ProductDetailFormData>({
    defaultValues: {
      quantity: 1,
    },
    resolver: zodResolver(productDetailFormSchema),
  });

  function onSubmit(data: ProductDetailFormData) {
    handleAddToCart({
      productOption: data.productOption,
      quantity: data.quantity,
    });
  }

  if (isLoading) {
    return (
      <div className="bg-[#fafafa] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 border-4 border-[#FF7622] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-[#fafafa] min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Produto não encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-48">
      <ProductImage product={product} />

      <div className="bg-white relative -mt-6 rounded-t-3xl">
        <ProductInfoSection
          name={product.name}
          description={product.description}
          value={product.value}
        />

        <FormProvider {...form}>
          <form id="product-detail-form" onSubmit={form.handleSubmit(onSubmit)}>
            <ProductOptionsSection productOptions={product.productOptions!} />
            <ProductDetailBottomBar productValue={product.value} />
          </form>
        </FormProvider>
      </div>

      {/*TODO: Move this to cart context*/}
      <ConfirmationModal
        isOpen={showStoreSwitchModal}
        title="Trocar de loja?"
        message="Você só pode adicionar itens de uma loja por vez. Deseja esvaziar o carrinho e adicionar este item?"
        confirmText="Esvaziar e adicionar"
        cancelText="Cancelar"
        onConfirm={handleConfirmStoreSwitch}
        onCancel={() => setShowStoreSwitchModal(false)}
      />
    </div>
  );
}
