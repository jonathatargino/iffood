import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { GoogleIcon } from "./components/google-icon";
import { BgAsset, BottomDecoration } from "./components/login-background";
import { useAuth } from "@/contexts/auth/context";
import { useNavigate } from "react-router";
import { useAvailability } from "@/contexts/availability/context";

export function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const { isThereAvailableStore } = useAvailability();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
    }
  };

  const handleGuestContinue = async () => {
    return await navigate("/");
  };

  return (
    <div
      className={cn(
        "relative flex h-screen w-full flex-col items-center overflow-hidden",
        "bg-linear-to-br from-[#FF7622] via-[#FF7622] to-[#E6661A]"
      )}
    >
      <BgAsset />
      <BottomDecoration />
      <div className="relative z-10 flex h-full w-full flex-col items-center px-6 pt-20">
        <header className="mb-12 text-center">
          <h1 className="mb-3 text-2xl font-bold text-white">Bem-vindo!</h1>
          <p className="text-sm text-white/90">
            Descubra as melhores comidas da faculdade
          </p>
        </header>

        <Card className="w-full max-w-sm rounded-[32px] border-0 bg-white shadow-2xl py-8 px-4">
          <CardContent className="space-y-5 ">
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              size="lg"
              className={cn(
                "w-full rounded-full border border-[#FF7622] bg-white py-6",
                "text-[#FF7622] shadow-sm transition-all text-sm",
                "hover:bg-orange-50 hover:shadow-md ",
                "active:scale-[0.98]"
              )}
            >
              <GoogleIcon />
              <span className="ml-1">Entrar com Google</span>
            </Button>

            <div className="flex items-center gap-4 py-3">
              <Separator className="flex-1" />
              <span className="text-sm text-gray-400">ou</span>
              <Separator className="flex-1" />
            </div>

            <Button
              onClick={handleGuestContinue}
              size="lg"
              className={cn(
                "w-full rounded-full bg-linear-to-r from-[#FF7622] to-[#E6661A] border-0",
                "py-6 text-white transition-all",
                "hover:shadow-lg active:scale-[0.98]"
              )}
            >
              Continuar como Visitante
            </Button>
          </CardContent>

          <p className="text-center text-xs leading-relaxed text-gray-400">
            O login so é permitido para{" "}
            <span className="text-[#FF7622] hover:underline">
              alunos do Instituto Federal de Educação, Ciência e Tecnologia do
              Estado do Ceará (IFCE)
            </span>{" "}
            Portanto, faça login com seu email institucional{" "}
            <span className="text-[#FF7622] hover:underline">
              email institucional.
            </span>{" "}
          </p>
        </Card>
      </div>
    </div>
  );
}
