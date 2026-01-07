import { Construction } from "lucide-react";
import { cn } from "@/lib/utils";

export function DesktopNotSupported() {
  return (
    <div
      className={cn(
        "flex h-screen w-full flex-col items-center justify-center",
        "bg-gradient-to-br from-[#FF7622] via-[#FF7622] to-[#E6661A]",
        "px-6 text-center"
      )}
    >
      <Construction className="mb-6 size-16 text-white" />
      <h1 className="mb-3 text-2xl font-bold text-white">
        Site disponível apenas em dispositivos móveis
      </h1>
      <p className="max-w-md text-base text-white/90">
        Em breve teremos suporte para desktop.
      </p>
    </div>
  );
}

