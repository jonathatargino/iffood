interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function SectionHeader({
  title,
  description,
  actions,
}: SectionHeaderProps) {
  return (
    <div className="flex h-18 items-center justify-between gap-2 bg-neutral-100 p-4">
      <div>
        <h3 className="font-bold text-gray-600">{title}</h3>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
