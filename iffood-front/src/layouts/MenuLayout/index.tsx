import { useLocation } from "react-router";
import { MobileMenu } from "./components/MobileMenu";
import { shouldOmitMenuLayout } from "./utils";

export function MenuLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const shouldOmit = shouldOmitMenuLayout(location.pathname);

  if (shouldOmit) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="pb-[70px]">{children}</div>
      <div className="fixed bottom-0 h-[70px] w-full">
        <MobileMenu />
      </div>
    </div>
  );
}
