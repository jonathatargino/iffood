import { useNavigate } from "react-router";
import { Store, LogOut, LogIn, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/auth/context";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useAvailability } from "@/contexts/availability/context";

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "size-11 bg-white rounded-2xl shadow-md",
        "flex items-center justify-center",
        "active:scale-95 transition-transform"
      )}
      aria-label="Voltar"
    >
      <ChevronLeft className="size-5 text-[#2e2e2e]" />
    </button>
  );
}

function Logo() {
  return <img src="/logo-white.svg" alt="Logo" />;
}

type MenuOptionProps = {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger";
};

function MenuOption({
  icon,
  label,
  onClick,
  disabled = false,
  variant = "default",
}: MenuOptionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full bg-white rounded-2xl p-5 flex items-center justify-between",
        "shadow-sm hover:shadow-lg transition-all",
        disabled ? "opacity-40 cursor-not-allowed" : "active:scale-[0.98]"
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "size-12 rounded-full flex items-center justify-center",
            variant === "danger" ? "bg-red-50" : "bg-gray-50"
          )}
        >
          {icon}
        </div>
        <span
          className={cn(
            "text-[#2e2e2e]",
            variant === "danger" && "text-red-600"
          )}
        >
          {label}
        </span>
      </div>
      <ChevronRight className="size-5 text-[#747783]" />
    </button>
  );
}

export function ConfiguracoesPage() {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const { isThereAvailableStore } = useAvailability();
  const isLoggedIn = !!session;

  console.log({ isThereAvailableStore });

  const handleBack = async () => {
    await navigate("/");
  };

  const handleMyStoreClick = async () => {
    if (isLoggedIn) {
      await navigate("/minha-loja");
    }
  };

  const handleLogout = async () => {
    await signOut();
    await navigate("/login");
  };

  const handleLogin = async () => {
    await navigate("/login");
  };

  return (
    <div className="bg-[#fafafa] min-h-screen">
      <div
        className={cn(
          "bg-gradient-to-br from-[#FF7622] to-[#E6661A]",
          "px-6 pt-14 pb-32 rounded-b-[32px] shadow-lg relative"
        )}
      >
        <div className="flex items-center gap-4 mb-16">
          {isThereAvailableStore && <BackButton onClick={handleBack} />}
          <h1 className="text-white text-lg font-medium">Configurações</h1>
        </div>

        <div className="flex justify-center">
          <Logo />
        </div>
      </div>

      <div className="px-6 mt-4 space-y-4 pb-8 relative z-10">
        <Card className="rounded-3xl border-0 shadow-lg p-4">
          <CardContent className="p-0">
            <MenuOption
              icon={<Store className="size-6 text-[#413DFB]" />}
              label="Minha Loja"
              onClick={handleMyStoreClick}
              disabled={!isLoggedIn}
            />
            {!isLoggedIn && (
              <p className="text-xs text-gray-400 px-5 pt-3 pb-1 leading-relaxed">
                Você precisa fazer login para acessar e gerenciar sua loja.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-lg p-4">
          <CardContent className="p-0">
            {isLoggedIn ? (
              <MenuOption
                icon={<LogOut className="size-6 text-red-600" />}
                label="Fazer Logout"
                onClick={handleLogout}
                variant="danger"
              />
            ) : (
              <MenuOption
                icon={<LogIn className="size-6 text-[#FF7622]" />}
                label="Fazer Login"
                onClick={handleLogin}
              />
            )}
          </CardContent>
        </Card>

        {/* <Card className="rounded-3xl border-0 shadow-lg p-4">
          <CardContent className="p-0">
            <MenuOption
              icon={<Heart className="size-6 text-red-600" />}
              label="Fazer Doação"
              onClick={handleDonationClick}
            />
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}
