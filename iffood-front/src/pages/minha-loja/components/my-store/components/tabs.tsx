import type { TabType } from "../types";

type TabProps = {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
};

export function Tab({ active, children, onClick }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 rounded-full whitespace-nowrap transition-all ${
        active
          ? "bg-[#FF7622] text-white shadow-lg"
          : "bg-white text-[#2e2e2e] hover:shadow-md"
      }`}
    >
      {children}
    </button>
  );
}

type TabsContainerProps = {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
};

export function TabsContainer({ activeTab, onTabChange }: TabsContainerProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide mb-6">
      <div className="flex gap-2 pb-2">
        <Tab
          active={activeTab === "general"}
          onClick={() => onTabChange("general")}
        >
          Geral
        </Tab>
        <Tab
          active={activeTab === "availability"}
          onClick={() => onTabChange("availability")}
        >
          Disponibilidade
        </Tab>
        <Tab
          active={activeTab === "products"}
          onClick={() => onTabChange("products")}
        >
          Produtos
        </Tab>
      </div>
    </div>
  );
}
