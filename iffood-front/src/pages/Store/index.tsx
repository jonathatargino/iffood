import type { RouteObject } from "react-router";
import { StorePage } from "./StorePage";
import { MinhaLojaPage } from "./MyStorePage";
import { EditarPedidoPage } from "./MyStorePage/editar-pedido";

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
            element: <MinhaLojaPage />,
          },
          {
            path: "pedidos/:orderId/editar",
            element: <EditarPedidoPage />,
          },
        ],
      },
    ],
  },
];
