import { useMediaQuery } from "./hooks/use-media-query";
import { LoginPage } from "./pages/login";
import { DesktopNotSupported } from "./pages/desktop-not-supported";

export function App() {
  const isMobile = useMediaQuery("(max-width: 600px)");

  if (!isMobile) {
    return <DesktopNotSupported />;
  }

  return <LoginPage />;
}

export default App;
