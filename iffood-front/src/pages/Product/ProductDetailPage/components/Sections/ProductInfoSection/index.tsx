import { formatCentsToReaisWithSymbol } from "@/utils/currency";

interface ProductInfoSectionProps {
  name: string;
  description: string;
  value: number;
}

export function ProductInfoSection({
  name,
  description,
  value,
}: ProductInfoSectionProps) {
  return (
    <div className="p-6">
      <h1 className="text-[#181c2e] text-xl font-bold mb-1">{name}</h1>
      <p className="text-sm text-gray-500 leading-relaxed mb-1">
        {description}
      </p>
      <div className="text-[#181c2e]">
        por {formatCentsToReaisWithSymbol(value)}
      </div>
    </div>
  );
}
