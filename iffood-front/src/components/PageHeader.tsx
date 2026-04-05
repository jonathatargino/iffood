import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

interface PageHeaderProps {
  text: string;
  hasBackButton?: boolean;
  actionsComponent?: React.ReactNode;
  hideWhenNotScrolled?: boolean;
}

export function PageHeader({
  text,
  hasBackButton = true,
  actionsComponent = null,
  hideWhenNotScrolled = false,
}: PageHeaderProps) {
  const [isWindowScrolled, setIsWindowScrolled] = useState(false);
  const navigate = useNavigate();

  const onBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsWindowScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3",
        "transition-all duration-300 ease-in-out",
        {
          "bg-white/90 py-2": isWindowScrolled,
        },
        {
          hidden: hideWhenNotScrolled && !isWindowScrolled,
        },
      )}
    >
      <div className="h-6 w-6">
        {hasBackButton && (
          <button onClick={onBack}>
            <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
          </button>
        )}
      </div>

      <p className="max-w-[60%] overflow-hidden text-sm font-bold text-ellipsis whitespace-nowrap">
        {text}
      </p>

      <div className={`${hasBackButton ? "min-w-6" : ""}`}>
        {actionsComponent && actionsComponent}
      </div>
    </div>
  );
}
