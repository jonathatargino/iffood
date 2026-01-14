import NoStoresAvailable from "@/pages/no-stores-available";
import { AvailabilityContext } from "./context";
import { useIsThereAvailableStoreQuery } from "./hooks";
import { SplashScreen } from "@/pages/splash-screen";
import { useLocation } from "react-router";

export function AvailabilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const isThereAvailableStoreQuery = useIsThereAvailableStoreQuery();

  const content = isThereAvailableStoreQuery.isLoading ? (
    <SplashScreen />
  ) : isThereAvailableStoreQuery.data || location.pathname !== "/" ? (
    children
  ) : (
    <NoStoresAvailable />
  );

  return (
    <AvailabilityContext.Provider
      value={{
        isThereAvailableStore: isThereAvailableStoreQuery.data ?? false,
      }}
    >
      {content}
    </AvailabilityContext.Provider>
  );
}
