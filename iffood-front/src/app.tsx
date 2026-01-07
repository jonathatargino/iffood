import { useMediaQuery } from "./hooks/use-media-query";
import { LoginPage } from "./pages/login";
import { DesktopNotSupported } from "./pages/desktop-not-supported";
import { useAuth } from "./contexts/auth/context";

export function App() {
  const { session, isInitialized } = useAuth();

  console.log({ session, isInitialized });

  const isMobile = useMediaQuery("(max-width: 600px)");

  if (!isMobile) {
    return <DesktopNotSupported />;
  }

  return <LoginPage />;
}

export default App;
