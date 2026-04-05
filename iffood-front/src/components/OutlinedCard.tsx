import { cn } from "@/lib/utils";

interface OutlinedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function OutlinedCard({
  children,
  className,
  onClick,
}: OutlinedCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg border border-gray-100 bg-white p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
