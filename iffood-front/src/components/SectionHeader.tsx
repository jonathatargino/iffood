interface SectionHeaderProps {
  title: string;
  description?: string;
}

export function SectionHeader({ title, description }: SectionHeaderProps) {
  return (
    <div className="bg-neutral-100 p-4">
      <h3 className="font-bold text-gray-600">{title}</h3>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );
}
