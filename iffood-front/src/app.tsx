import { useMediaQuery } from "./hooks/use-media-query";
import { LoginPage } from "./pages/login";
import { DesktopNotSupported } from "./pages/desktop-not-supported";
import { ConfiguracoesPage } from "./pages/configuracoes";
import { MinhaLojaPage } from "./pages/minha-loja";
import { AuthProvider } from "./contexts/auth";
import { QueryProvider } from "./contexts/query";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Toaster } from "@/components/ui/sonner";

const router = createBrowserRouter([
  {
    path: "/",
    element: <div>Home</div>,
  },
  {
    path: "login",
    element: <LoginPage />,
  },
  {
    path: "configuracoes",
    element: <ConfiguracoesPage />,
  },
  {
    path: "minha-loja",
    element: <MinhaLojaPage />,
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
