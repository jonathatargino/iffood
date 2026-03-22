import { AuthProvider } from "@/contexts/auth";
import { AvailabilityProvider } from "@/contexts/availability";
import { CartProvider } from "@/contexts/cart";
import { OrderProvider } from "@/contexts/order";
import { QueryProvider } from "@/contexts/query";
import { appRoutes } from "@/pages";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Toaster } from "sonner";

const router = createBrowserRouter(appRoutes);

export function AppProviders() {
  return (
    <>
      <QueryProvider>
        <AuthProvider>
          <CartProvider>
            <OrderProvider>
              <AvailabilityProvider>
                <RouterProvider router={router} />
              </AvailabilityProvider>
            </OrderProvider>
          </CartProvider>
        </AuthProvider>
      </QueryProvider>
      <Toaster richColors position="top-center" />
    </>
  );
}
