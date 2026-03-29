import { useAuth } from "@/contexts/auth/context";
import { getFirstName } from "./utils";

interface HomeBaseHeaderProps {
  children: React.ReactNode;
}

export function HomeBaseHeader({ children }: HomeBaseHeaderProps) {
  const { userProfile } = useAuth();
  const username = userProfile ? getFirstName(userProfile.name) : "Convidado";

  return (
    <div className="flex flex-col gap-4 rounded-b-2xl bg-gradient-to-br from-[#FF7622] to-[#E6661A] px-6 pt-4 pb-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-md font-bold text-white">Olá, {username}! 👋</h1>
          <p className="text-sm text-white/80">O que vai pedir hoje?</p>
        </div>
      </div>
      {children}
    </div>
  );
}
