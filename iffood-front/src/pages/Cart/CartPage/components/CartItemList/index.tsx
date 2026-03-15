import { useCart } from "@/contexts/cart/context";
import { CartItemUnit } from "./components/CartItemUnit";
import { SectionHeader } from "@/components/SectionHeader";
import React from "react";
import { AddMoreItemsCTA } from "../AddMoreItemsCTA";

export function CartItemList() {
  const { state } = useCart();

  return (
    <div className="space-y-4 py-6">
      <SectionHeader
        title="Itens adicionados"
        description="Revise os itens no seu carrinho"
      />

      <div className="flex flex-col gap-4 px-6">
        {state.items.map((item, index) => (
          <React.Fragment key={item.productOption.id}>
            {index > 0 && <hr className="mx-auto w-[90%] border-gray-200" />}
            <CartItemUnit item={item} />
          </React.Fragment>
        ))}
      </div>

      <div className="mx-auto w-fit">
        <AddMoreItemsCTA />
      </div>
    </div>
  );
}
