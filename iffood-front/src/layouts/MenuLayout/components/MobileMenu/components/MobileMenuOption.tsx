import { Link, useLocation } from "react-router";

interface MobileMenuOptionProps {
  icon: React.ReactNode;
  label: string;
  path: string;
}

export function MobileMenuOption({ icon, label, path }: MobileMenuOptionProps) {
  const location = useLocation();

  const isSelected = location.pathname === path;

  return (
    <Link
      to={path}
      className={`flex flex-col items-center gap-1 ${isSelected ? "font-bold text-gray-700" : "text-gray-400"}`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Link>
  );
}
