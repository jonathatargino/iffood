import { Outlet, type RouteObject } from "react-router";
import { productRoutes } from "./Product";
import { storeRoutes } from "./Store";
import { cartRoutes } from "./Cart";
import { authRoutes } from "./Auth";
import { homeRoutes } from "./Home";
import { MenuLayout } from "@/layouts/MenuLayout";
import { CartCTALayout } from "@/layouts/CartCTALayout";
import { NotFoundPage } from "./NotFoundPage";

export const appRoutes: RouteObject[] = [
  ...authRoutes,
  {
    element: (
      <MenuLayout>
        <CartCTALayout>
          <Outlet />
        </CartCTALayout>
      </MenuLayout>
    ),
    children: [...homeRoutes, ...productRoutes, ...storeRoutes, ...cartRoutes],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
];
