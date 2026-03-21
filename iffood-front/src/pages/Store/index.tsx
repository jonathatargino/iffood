import type { RouteObject } from "react-router";
import { StorePage } from "./StorePage";
import { lazy } from "react";

const MyStorePage = lazy(() => import("./MyStorePage"));
const EditOrderRequestPage = lazy(
  () => import("./MyStorePage/EditOrderRequestPage"),
);

export const storeRoutes: RouteObject[] = [
  {
    path: "loja",
    children: [
      {
        path: ":storeId",
        element: <StorePage />,
      },
      {
        path: "minha-loja",
        children: [
          {
            index: true,
            element: <MyStorePage />,
          },
          {
            path: "pedidos/editar/:orderId",
            element: <EditOrderRequestPage />,
          },
        ],
      },
    ],
  },
];
