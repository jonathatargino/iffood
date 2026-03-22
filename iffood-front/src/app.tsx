import { useMediaQuery } from "./hooks/use-media-query";
import { DesktopNotSupportedView } from "./views/desktop-not-supported";
import { AppProviders } from "./components/AppProviders";

export function App() {
  const isMobile = useMediaQuery("(max-width: 600px)");

  if (!isMobile) {
    return <DesktopNotSupportedView />;
  }

  return <AppProviders />;
}

export default App;
