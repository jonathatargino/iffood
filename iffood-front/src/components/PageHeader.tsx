import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router";

interface PageHeaderProps {
  text: string;
  hasBackButton?: boolean;
  actionsComponent?: React.ReactNode;
}

export function PageHeader({
  text,
  hasBackButton = true,
  actionsComponent = null,
}: PageHeaderProps) {
  const navigate = useNavigate();

  const onBack = () => {
    navigate(-1);
  };

  return (
    <div className="sticky top-0 z-10 mb-6 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
      <div>
        {hasBackButton && (
          <button onClick={onBack}>
            <ChevronLeft className="h-6 w-6" strokeWidth={2.5} />
          </button>
        )}
      </div>

      <p className="text-sm font-bold">{text}</p>

      <div className={`${hasBackButton ? "min-w-6" : ""}`}>
        {actionsComponent && actionsComponent}
      </div>
    </div>
  );
}
