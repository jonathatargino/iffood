import { useLocation } from "react-router";
import { MobileMenu } from "./components/MobileMenu";
import { shouldOmitMenuLayout } from "./utils";

export function MenuLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const shouldOmit = shouldOmitMenuLayout(location.pathname);

  if (shouldOmit) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <div className="pb-[50px]">{children}</div>
      <div className="fixed bottom-0 h-[50px] w-full">
        <MobileMenu />
      </div>
    </div>
  );
}
