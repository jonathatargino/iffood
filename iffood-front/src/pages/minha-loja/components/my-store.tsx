import type { Store } from "@/services/store";

interface MyStoreProps {
  store: Store;
}

export function MyStore({ store }: MyStoreProps) {
  return (
    <div className="bg-[#fafafa] min-h-screen">
      {/* Header */}
      <div className="bg-linear-to-br from-[#FF7622] to-[#E6661A] px-6 pt-14 pb-8 rounded-b-4xl shadow-lg">
        <h1 className="text-white text-lg font-semibold">Minha Loja</h1>
      </div>

      {/* Temporary content */}
      <div className="px-6 py-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-[#2e2e2e] mb-4">Minha Loja</h2>
          <div className="space-y-3 text-gray-600">
            <p>
              <strong>Nome:</strong> {store.name}
            </p>
            <p>
              <strong>Descrição:</strong> {store.description}
            </p>
            <p>
              <strong>WhatsApp:</strong> {store.whatsapp}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
