import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: React.HTMLAttributes<HTMLDivElement>["className"];
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex h-18 items-center justify-between gap-2 bg-neutral-100 p-4",
        className,
      )}
    >
      <div>
        <h3 className="font-bold text-gray-600">{title}</h3>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
