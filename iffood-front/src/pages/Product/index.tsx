import type { RouteObject } from "react-router";
import { ProductPage } from "./ProductPage/wrapper";
import { ProductDetailPage } from "./ProductDetailPage";

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
