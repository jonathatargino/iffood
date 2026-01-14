import { useMediaQuery } from "./hooks/use-media-query";
import { LoginPage } from "./pages/login";
import { DesktopNotSupported } from "./pages/desktop-not-supported";
import { ConfiguracoesPage } from "./pages/configuracoes";
import { MinhaLojaPage } from "./pages/minha-loja";
import Home from "./pages/home";
import SearchPage from "./pages/busca";
import ViewAllPage from "./pages/ver-todos";
import { ProductFormWrapper } from "./pages/produto/wrapper";
import { ProductDetail } from "./pages/produto-detalhes";
import { RestaurantView } from "./pages/loja";
import { AuthProvider } from "./contexts/auth";
import { QueryProvider } from "./contexts/query";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { AvailabilityProvider } from "./contexts/availability";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AvailabilityProvider>
        <Outlet />
      </AvailabilityProvider>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "configuracoes",
        element: <ConfiguracoesPage />,
      },
    ],
  },
  {
    path: "minha-loja",
    element: <MinhaLojaPage />,
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
    path: "busca",
    element: <SearchPage />,
  },
  {
    path: ":type",
    element: <ViewAllPage />,
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
        <RouterProvider router={router} />
        <Toaster richColors position="top-center" />
      </QueryProvider>
    </AuthProvider>
  );
}

export default App;
