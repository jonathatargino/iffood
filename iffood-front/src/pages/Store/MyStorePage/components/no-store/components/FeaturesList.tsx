type FeatureListItemProps = {
  text: string;
};

function FeatureListItem({ text }: FeatureListItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-green-100">
        <svg
          className="h-3.5 w-3.5 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </div>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}

export function FeaturesList() {
  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      <p className="mb-4 text-left text-sm text-gray-400">
        Com sua loja você poderá:
      </p>
      <div className="space-y-3 text-left">
        <FeatureListItem text="Adicionar produtos ilimitados" />
        <FeatureListItem text="Gerenciar estoque e sabores" />
        <FeatureListItem text="Receber pedidos via WhatsApp" />
      </div>
    </div>
  );
}
