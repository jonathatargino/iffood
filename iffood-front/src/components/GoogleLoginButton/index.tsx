import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { GoogleIcon } from "./components/google-icon";
import { useAuth } from "@/contexts/auth/context";

export function GoogleLoginButton() {
  const { signInWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <Button
      onClick={handleGoogleLogin}
      variant="outline"
      size="sm"
      className={cn(
        "w-full rounded-full border border-[#FF7622] bg-white py-6",
        "text-sm text-[#FF7622] shadow-sm transition-all",
        "hover:bg-orange-50 hover:shadow-md",
        "active:scale-[0.98]",
      )}
    >
      <GoogleIcon />
      <span className="ml-1">Entrar com Google</span>
    </Button>
  );
}
