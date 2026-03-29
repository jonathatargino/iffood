import { Search } from "lucide-react";

export function NoResultsFoundView() {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
        <Search className="h-12 w-12 text-gray-300" />
      </div>
      <p className="text-gray-400">Nenhum resultado encontrado</p>
      <p className="mt-2 text-sm text-gray-300">Tente buscar por outro termo</p>
    </div>
  );
}
