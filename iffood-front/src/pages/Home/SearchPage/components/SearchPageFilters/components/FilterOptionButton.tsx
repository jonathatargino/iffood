import { cn } from "@/lib/utils";

interface FilterOptionButtonProps {
  onClick: () => void;
  isActive: boolean;
  children: React.ReactNode;
  size?: "large" | "small";
}

export function FilterOptionButton({
  onClick,
  isActive,
  children,
  size = "large",
}: FilterOptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-2xl bg-white py-3.5 text-[#2e2e2e] shadow-sm transition-all hover:shadow-md",
        {
          "bg-[#FF7622] text-white shadow-lg": isActive,
        },
        {
          "rounded-xl py-2.5 text-sm": size === "small",
        },
      )}
    >
      {children}
    </button>
  );
}
