import { Outlet, type RouteObject } from "react-router";
import { productRoutes } from "./Product";
import { storeRoutes } from "./Store";
import { cartRoutes } from "./Cart";
import { authRoutes } from "./Auth";
import { homeRoutes } from "./Home";
import { MenuLayout } from "@/layouts/MenuLayout";
import { CartCTALayout } from "@/layouts/CartCTALayout";
import { NotFoundPage } from "./NotFoundPage";
import { ReviewGuard } from "@/components/Guards/ReviewGuard";

export const appRoutes: RouteObject[] = [
  ...authRoutes,
  {
    element: (
      <ReviewGuard>
        <MenuLayout>
          <CartCTALayout>
            <Outlet />
          </CartCTALayout>
        </MenuLayout>
      </ReviewGuard>
    ),
    children: [...homeRoutes, ...productRoutes, ...storeRoutes, ...cartRoutes],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
];
