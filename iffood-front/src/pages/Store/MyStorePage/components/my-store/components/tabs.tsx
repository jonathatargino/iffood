import { useRef } from "react";
import type { TabType } from "../types";

type TabProps = {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  ref: React.RefObject<HTMLButtonElement | null>;
  scrollToComponentRef: React.RefObject<HTMLButtonElement | null>;
};

export function Tab({
  active,
  children,
  onClick,
  ref,
  scrollToComponentRef,
}: TabProps) {
  return (
    <button
      onClick={() => {
        scrollToComponentRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        onClick();
      }}
      ref={ref}
      className={`rounded-full px-5 py-3 whitespace-nowrap transition-all ${
        active
          ? "bg-[#FF7622] text-white"
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
  const generalTabRef = useRef<HTMLButtonElement>(null);
  const availabilityTabRef = useRef<HTMLButtonElement>(null);
  const productsTabRef = useRef<HTMLButtonElement>(null);
  const ordersTabRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="scrollbar-hide mb-6 overflow-x-auto">
      <div className="flex gap-2 pb-2">
        <Tab
          active={activeTab === "general"}
          onClick={() => onTabChange("general")}
          ref={generalTabRef}
          scrollToComponentRef={generalTabRef}
        >
          Geral
        </Tab>
        <Tab
          active={activeTab === "availability"}
          onClick={() => onTabChange("availability")}
          ref={availabilityTabRef}
          scrollToComponentRef={generalTabRef}
        >
          Disponibilidade
        </Tab>
        <Tab
          active={activeTab === "products"}
          onClick={() => onTabChange("products")}
          ref={productsTabRef}
          scrollToComponentRef={ordersTabRef}
        >
          Produtos
        </Tab>
        <Tab
          active={activeTab === "orders"}
          onClick={() => onTabChange("orders")}
          ref={ordersTabRef}
          scrollToComponentRef={ordersTabRef}
        >
          Pedidos
        </Tab>
      </div>
    </div>
  );
}
