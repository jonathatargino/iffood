import { formatCentsToReaisWithSymbol } from "@/utils/currency";

interface OrderCardFooterProps {
  totalPrice: number;
}

export function OrderCardFooter({ totalPrice }: OrderCardFooterProps) {
  return (
    <div className="flex items-center justify-end">
      <div className="text-bold text-sm font-medium text-[#FF7622]">
        Total: {formatCentsToReaisWithSymbol(totalPrice)}
      </div>
    </div>
  );
}
