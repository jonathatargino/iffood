import { AuthProvider } from "@/contexts/auth";
import { AvailabilityProvider } from "@/contexts/availability";
import { CartProvider } from "@/contexts/cart";
import { QueryProvider } from "@/contexts/query";
import { appRoutes } from "@/pages";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Toaster } from "sonner";

const router = createBrowserRouter(appRoutes);

export function AppProviders() {
  return (
    <>
      <AuthProvider>
        <QueryProvider>
          <CartProvider>
            <AvailabilityProvider>
              <RouterProvider router={router} />
            </AvailabilityProvider>
          </CartProvider>
        </QueryProvider>
      </AuthProvider>
      <Toaster richColors position="top-center" />
    </>
  );
}
