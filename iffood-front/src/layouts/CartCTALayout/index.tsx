import { useCart } from "@/contexts/cart/context";
import { CartCTAMobile } from "./components/CartCTAMobile";
import { omitMenuLayoutPathList } from "../MenuLayout/const";
import { useLocation } from "react-router";

export function CartCTALayout({ children }: { children: React.ReactNode }) {
  const { itemCount } = useCart();
  const location = useLocation();

  const shouldShow =
    itemCount > 0 && !location.pathname.includes("/produto/detalhes/");
  if (!shouldShow) return <>{children}</>;

  const isMainMobileMenuOmitted = omitMenuLayoutPathList.includes(
    location.pathname,
  );

  return (
    <div className="h-full">
      <div className={`${isMainMobileMenuOmitted ? "pb-0" : "pb-[68px]"}`}>
        {children}
      </div>
      <div
        className={`fixed ${isMainMobileMenuOmitted ? "bottom-0" : "bottom-[68px]"} w-full`}
      >
        <CartCTAMobile />
      </div>
    </div>
  );
}
