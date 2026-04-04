import { Button } from "../Button";
import { GoogleIcon } from "./components/GoogleIcon";
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
      className={"w-full"}
    >
      <GoogleIcon />
      <span className="ml-1">Entrar com Google</span>
    </Button>
  );
}
