import { useMediaQuery } from "./hooks/use-media-query";
import { LoginPage } from "./pages/login";
import { DesktopNotSupported } from "./pages/desktop-not-supported";
import { MinhaLojaPage } from "./pages/minha-loja";
import { EditarPedidoPage } from "./pages/minha-loja/editar-pedido";
import Home from "./pages/home";
import SearchPage from "./pages/busca";
import ViewAllPage from "./pages/ver-todos";
import { ProductFormWrapper } from "./pages/produto/wrapper";
import { ProductDetail } from "./pages/produto-detalhes";
import { RestaurantView } from "./pages/loja";
import { CartPage } from "./pages/carrinho";
import { AuthProvider } from "./contexts/auth";
import { QueryProvider } from "./contexts/query";
import { CartProvider } from "./contexts/cart";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { AvailabilityProvider } from "./contexts/availability";
import { MenuLayout } from "./layouts/MenuLayout";
import { CartCTALayout } from "./layouts/CartCTALayout";

const router = createBrowserRouter([
  {
    element: (
      <>
        <Outlet />
        <Toaster richColors position="top-center" />
      </>
    ),
    children: [
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "/",
        element: (
          <MenuLayout>
            <CartCTALayout>
              <Outlet />
            </CartCTALayout>
          </MenuLayout>
        ),
        children: [
          {
            index: true,
            element: (
              <AvailabilityProvider>
                <Home />
              </AvailabilityProvider>
            ),
          },
          {
            path: "minha-loja",
            element: <MinhaLojaPage />,
          },
          {
            path: "minha-loja/pedidos/:orderId/editar",
            element: <EditarPedidoPage />,
          },
          {
            path: "produto/:productId",
            element: <ProductFormWrapper />,
          },
          {
            path: "produto-detalhes/:productId",
            element: <ProductDetail />,
          },
          {
            path: "loja/:storeId",
            element: <RestaurantView />,
          },
          {
            path: "carrinho",
            element: <CartPage />,
          },
          {
            path: "busca",
            element: <SearchPage />,
          },
          {
            path: ":type",
            element: <ViewAllPage />,
          },
        ],
      },
    ],
  },
]);

export function App() {
  const isMobile = useMediaQuery("(max-width: 600px)");

  if (!isMobile) {
    return <DesktopNotSupported />;
  }

  return (
    <AuthProvider>
      <QueryProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </QueryProvider>
    </AuthProvider>
  );
}

export default App;
