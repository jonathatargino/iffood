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
        "flex-1 rounded-lg border border-gray-100 bg-white py-3.5 text-[#2e2e2e] transition-all",
        {
          "border-0 bg-[#FF7622] text-white shadow-lg": isActive,
        },
        {
          "py-2.5 text-sm": size === "small",
        },
      )}
    >
      {children}
    </button>
  );
}
