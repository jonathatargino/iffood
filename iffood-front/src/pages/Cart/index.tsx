import type { RouteObject } from "react-router";
import { lazy } from "react";

const CartPage = lazy(() => import("./CartPage"));

export const cartRoutes: RouteObject[] = [
  {
    path: "carrinho",
    children: [
      {
        index: true,
        element: <CartPage />,
      },
    ],
  },
];
