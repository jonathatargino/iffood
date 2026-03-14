import { useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product";
import { useCart } from "@/contexts/cart/context";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { toast } from "sonner";
import { ProductImage } from "./components/ProductImage";
import { ProductInfoSection } from "./components/Sections/ProductInfoSection";
import { ProductOptionsSection } from "./components/Sections/ProductOptionsSection";
import { ProductDetailBottomBar } from "./components/ProductDetailBottomBar";

type SelectedFlavor = {
  flavor: any;
  quantity: number;
};

export function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const [selectedFlavors, setSelectedFlavors] = useState<SelectedFlavor[]>([]);
  const [showStoreSwitchModal, setShowStoreSwitchModal] = useState(false);
  const cart = useCart();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product-public", productId],
    queryFn: () => productService.getProductById(productId!),
    enabled: !!productId,
  });

  const productFlavors = product?.productOptions || [];

  const handleFlavorSelect = (flavor: any) => {
    if (flavor.quantity === 0) return;

    const existingIndex = selectedFlavors.findIndex(
      (sf) => sf.flavor.id === flavor.id,
    );

    if (existingIndex >= 0) {
      // Remove if already selected
      setSelectedFlavors(selectedFlavors.filter((_, i) => i !== existingIndex));
    } else {
      // Add new flavor with quantity 1
      setSelectedFlavors([...selectedFlavors, { flavor, quantity: 1 }]);
    }
  };

  const addAllToCart = (forceSwitchStore = false) => {
    if (!product || selectedFlavors.length === 0 || !product.store) return;

    const store = {
      id: product.store.id,
      name: product.store.name,
      whatsapp: product.store.whatsapp,
    };

    if (forceSwitchStore) {
      const firstItem = selectedFlavors[0];
      cart.switchStoreAndAdd(
        {
          productId: product.id,
          productOptionId: firstItem.flavor.id,
          productName: product.name,
          productValue: product.value,
          optionName: firstItem.flavor.name,
          quantity: firstItem.quantity,
          maxQuantity: firstItem.flavor.quantity,
          photoUrl: product.photoUrl,
        },
        store,
      );
      for (let i = 1; i < selectedFlavors.length; i++) {
        const sf = selectedFlavors[i];
        cart.addItem(
          {
            productId: product.id,
            productOptionId: sf.flavor.id,
            productName: product.name,
            productValue: product.value,
            optionName: sf.flavor.name,
            quantity: sf.quantity,
            maxQuantity: sf.flavor.quantity,
            photoUrl: product.photoUrl,
          },
          store,
        );
      }
    } else {
      for (const sf of selectedFlavors) {
        cart.addItem(
          {
            productId: product.id,
            productOptionId: sf.flavor.id,
            productName: product.name,
            productValue: product.value,
            optionName: sf.flavor.name,
            quantity: sf.quantity,
            maxQuantity: sf.flavor.quantity,
            photoUrl: product.photoUrl,
          },
          store,
        );
      }
    }

    toast.success("Adicionado ao carrinho!");
    setSelectedFlavors([]);
  };

  const handleAddToCart = () => {
    if (!product || selectedFlavors.length === 0 || !product.store) return;

    if (cart.needsStoreSwitch(product.store.id)) {
      setShowStoreSwitchModal(true);
      return;
    }

    addAllToCart();
  };

  const handleConfirmStoreSwitch = () => {
    setShowStoreSwitchModal(false);
    addAllToCart(true);
  };

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

  const totalQuantity = selectedFlavors.reduce(
    (sum, sf) => sum + sf.quantity,
    0,
  );
  const totalPrice = product.value * totalQuantity;
  const canOrder = selectedFlavors.length > 0;

  return (
    <div className="bg-white min-h-screen pb-48">
      <ProductImage product={product} />

      <div className="bg-white border relative -mt-6 rounded-t-3xl">
        <ProductInfoSection
          name={product.name}
          description={product.description}
          value={product.value}
        />

        <ProductOptionsSection
          productOptions={productFlavors}
          onOptionSelect={handleFlavorSelect}
          // TODO: Handle multiple selection scenario properly
          selectedProductOption={selectedFlavors[0]?.flavor}
        />

        <ProductDetailBottomBar
          canOrder={canOrder}
          totalPrice={totalPrice}
          selectedFlavors={selectedFlavors}
          handleAddToCart={handleAddToCart}
        />
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
