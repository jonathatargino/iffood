import { SearchIcon, StoreIcon } from "lucide-react";
import { MobileMenuOption } from "./components/MobileMenuOption";

export function MobileMenu() {
  return (
    <div className="flex w-full items-center justify-around border-t border-gray-100 bg-white p-3">
      <MobileMenuOption
        icon={<SearchIcon width={24} height={24} />}
        label="Busca"
        path="/"
      />

      <MobileMenuOption
        icon={<StoreIcon width={24} height={24} />}
        label="Minha Loja"
        path="/minha-loja"
      />
    </div>
  );
}
