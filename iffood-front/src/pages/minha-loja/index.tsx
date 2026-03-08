import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { storeService } from "@/services/store";
import { NoStore } from "./components/no-store";
import { StoreForm } from "./components/store-form";
import { MyStore } from "./components/my-store";

export function MinhaLojaPage() {
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
    return (
      <div className="bg-[#fafafa] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 border-4 border-[#FF7622] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
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
        onBack={() => setView("no-store")}
        onSave={async () => {
          await refetch();
          setView("my-store");
        }}
      />
    );
  }

  return <MyStore store={stores?.[0]!} />;
}
