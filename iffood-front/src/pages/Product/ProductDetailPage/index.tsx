import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { productService, type ProductOption } from "@/services/product";
import { useCart } from "@/contexts/cart/context";
import { ProductImage } from "./components/ProductImage";
import { ProductInfoSection } from "./components/Sections/ProductInfoSection";
import { ProductOptionsSection } from "./components/Sections/ProductOptionsSection";
import { ProductDetailBottomBar } from "./components/ProductDetailBottomBar";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productDetailFormSchema, type ProductDetailFormData } from "./schema";
import type { Store } from "@/services/store";
import { LoadingView } from "@/views/LoadingView";

export function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const cart = useCart();
  const navigate = useNavigate();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product-public", productId],
    queryFn: () => productService.getProductById(productId!),
    enabled: !!productId,
  });

  const handleAddToCart = ({
    productOption,
    quantity,
  }: {
    productOption: ProductOption;
    quantity: number;
  }) => {
    if (!product || !product.store) return;

    cart.addItem(
      {
        product,
        productOption,
        quantity,
      },
      product.store as Store,
    );
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

    navigate(`/loja/${product?.store?.id}`);
  }

  if (isLoading) {
    return <LoadingView />;
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
        <p className="text-gray-500">Produto não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-48">
      <ProductImage product={product} />

      <div className="relative -mt-6 h-full rounded-t-3xl bg-white">
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
    </div>
  );
}

export default ProductDetailPage;
