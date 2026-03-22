import { Clock } from "lucide-react";

export default function NoStoresAvailable() {
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
