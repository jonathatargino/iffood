import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { storeService } from "@/services/store";
import { NoStore } from "./components/no-store";
import { StoreForm } from "./components/store-form";
import { LoadingView } from "@/views/LoadingView";

export function MyStorePage() {
  const [view, setView] = useState<
    "check" | "no-store" | "create-store" | "my-store"
  >("check");

  const {
    data: stores,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["my-store"],
    queryFn: storeService.getMyStore,
  });

  // Determinar qual view mostrar
  useEffect(() => {
    if (!isLoading && view === "check") {
      if (stores?.length) {
        setView("my-store");
      } else {
        setView("no-store");
      }
    }
  }, [isLoading, stores, view]);

  if (isLoading || view === "check") {
    return <LoadingView />;
  }

  if (view === "no-store") {
    return (
      <NoStore
        onBack={() => window.history.back()}
        onCreateStore={() => setView("create-store")}
      />
    );
  }

  if (view === "create-store") {
    return (
      <StoreForm
        onSave={async () => {
          await refetch();
          setView("my-store");
        }}
      />
    );
  }

  return (
    <NoStore
      onBack={() => window.history.back()}
      onCreateStore={() => setView("create-store")}
    />
  );
}

export default MyStorePage;
