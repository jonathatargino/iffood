import { CurrentStoreInfo } from "./components/CurrentStoreInfo";
import { CartCTAButton } from "./components/CartCTAButton";

export function CartCTAMobile() {
  return (
    <div className="flex h-full w-full items-center justify-between gap-8 border-t border-gray-100 bg-white p-3">
      <CurrentStoreInfo />
      <CartCTAButton />
    </div>
  );
}
