import { useNavigate } from "react-router";
import { Clock } from "lucide-react";

function MenuIcon({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex size-11 items-center justify-center rounded-2xl bg-white shadow-xl transition-all hover:shadow-2xl active:scale-95"
    >
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path
          d="M4 18h10M4 12h16M4 6h7"
          stroke="#FF7622"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </button>
  );
}

export default function NoStoresAvailable() {
  const navigate = useNavigate();

  const now = new Date();
  const currentHour = now.getHours();

  const isEarly = currentHour >= 0 && currentHour < 8;
  const isLate = currentHour >= 22;
  const message =
    isEarly || isLate
      ? "Ops! Você chegou cedo demais"
      : "Ops! Você chegou tarde demais";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF7622] to-[#E6661A]">
      <div className="px-6 pt-14 pb-8">
        <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-4 pb-20 text-center">
          <div className="mb-8 rounded-full bg-white/10 p-8 backdrop-blur-sm">
            <Clock className="h-24 w-24 text-white" strokeWidth={1.5} />
          </div>

          <h1 className="mb-4 text-3xl font-bold text-white">{message}</h1>

          <p className="mb-3 max-w-md text-lg leading-relaxed text-white/90">
            No momento não há nenhum restaurante em funcionamento ou com
            produtos disponíveis.
          </p>

          <p className="max-w-sm text-sm leading-relaxed text-white/70">
            Volte mais tarde para encontrar opções disponíveis para você!
          </p>
        </div>
      </div>
    </div>
  );
}
