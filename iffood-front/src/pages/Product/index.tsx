import { lazy } from "react";
import type { RouteObject } from "react-router";

const ProductPage = lazy(() => import("./ProductPage/wrapper"));
const ProductDetailPage = lazy(() => import("./ProductDetailPage"));

export const productRoutes: RouteObject[] = [
  {
    path: "produto",
    children: [
      {
        path: ":productId",
        element: <ProductPage />,
      },
      {
        path: "detalhes/:productId",
        element: <ProductDetailPage />,
      },
    ],
  },
];
