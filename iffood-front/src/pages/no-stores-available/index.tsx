import { useNavigate } from "react-router";
import { Clock } from "lucide-react";

function MenuIcon({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="size-11 bg-white rounded-2xl shadow-xl flex items-center justify-center hover:shadow-2xl transition-all active:scale-95"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
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

  const handleMenuClick = () => {
    navigate("/configuracoes");
  };

  return (
    <div className="bg-gradient-to-br from-[#FF7622] to-[#E6661A] min-h-screen">
      <div className="px-6 pt-14 pb-8">
        <div className="flex items-center mb-8">
          <MenuIcon onClick={handleMenuClick} />
        </div>

        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4 pb-20">
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-8 mb-8">
            <Clock className="w-24 h-24 text-white" strokeWidth={1.5} />
          </div>

          <h1 className="text-white text-3xl font-bold mb-4">{message}</h1>

          <p className="text-white/90 text-lg mb-3 max-w-md leading-relaxed">
            No momento não há nenhum restaurante em funcionamento
          </p>

          <p className="text-white/70 text-sm max-w-sm leading-relaxed">
            Volte mais tarde para encontrar opções disponíveis para você!
          </p>
        </div>
      </div>
    </div>
  );
}
