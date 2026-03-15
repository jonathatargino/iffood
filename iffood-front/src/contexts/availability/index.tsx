import { AvailabilityContext } from "./context";
import { useIsThereAvailableStoreQuery } from "./hooks";

export function AvailabilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isThereAvailableStoreQuery = useIsThereAvailableStoreQuery();

  return (
    <AvailabilityContext.Provider
      value={{
        isThereAvailableStore: isThereAvailableStoreQuery.data ?? false,
      }}
    >
      {children}
    </AvailabilityContext.Provider>
  );
}
