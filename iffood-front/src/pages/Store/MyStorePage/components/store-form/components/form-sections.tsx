import { Store } from "lucide-react";

export function FormHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-linear-to-br from-[#FF7622] to-[#E6661A] px-6 pt-14 pb-8 rounded-b-4xl shadow-lg">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="size-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center hover:bg-white transition-all active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
            <path
              d="M15 18l-6-6 6-6"
              stroke="#2e2e2e"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-white text-lg font-semibold">Criar Loja</h1>
          <p className="text-white/80 text-sm">Preencha os dados da sua loja</p>
        </div>
      </div>
    </div>
  );
}

export function InfoCard() {
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5">
      <div className="flex items-start gap-3">
        <div className="size-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
          <Store className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-900 mb-1">
            Próximos passos
          </h4>
          <p className="text-xs text-blue-700 leading-relaxed">
            Após criar sua loja, você poderá configurar horários de
            funcionamento, adicionar produtos e começar a receber pedidos.
          </p>
        </div>
      </div>
    </div>
  );
}

type SubmitButtonProps = {
  isSubmitting: boolean;
};

export function SubmitButton({ isSubmitting }: SubmitButtonProps) {
  return (
    <>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-linear-to-r from-[#FF7622] to-[#E6661A] text-white py-4 rounded-full uppercase transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Criando...
          </>
        ) : (
          <>
            <Store className="w-5 h-5" />
            Criar Loja
          </>
        )}
      </button>
    </>
  );
}
