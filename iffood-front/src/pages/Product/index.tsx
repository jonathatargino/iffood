import { lazy } from "react";
import type { RouteObject } from "react-router";

const ProductPage = lazy(() => import("./ProductPage/wrapper"));
const ProductDetailPage = lazy(() => import("./ProductDetailPage"));

export const productRoutes: RouteObject[] = [
  {
    path: "produto",
    children: [
      {
        path: "novo",
        element: <ProductPage isEditing={false} />,
      },
      {
        path: ":productId",
        element: <ProductPage isEditing={true} />,
      },
      {
        path: "detalhes/:productId",
        element: <ProductDetailPage />,
      },
    ],
  },
];
