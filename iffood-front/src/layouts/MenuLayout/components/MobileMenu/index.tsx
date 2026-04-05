import { SearchIcon, StoreIcon } from "lucide-react";
import { MobileMenuOption } from "./components/MobileMenuOption";

export function MobileMenu() {
  return (
    <div className="flex h-[50px] w-full items-center justify-around border-t border-gray-100 bg-white px-3 py-1">
      <MobileMenuOption
        icon={<SearchIcon width={20} height={20} />}
        label="Busca"
        path="/"
      />

      <MobileMenuOption
        icon={<StoreIcon width={20} height={20} />}
        label="Minha Loja"
        path="/loja/minha-loja"
      />
    </div>
  );
}
