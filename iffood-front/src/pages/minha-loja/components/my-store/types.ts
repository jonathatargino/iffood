export type TabType = "general" | "availability" | "products" | "orders";

export type WeekDay = {
  weekday: number;
  name: string;
  enabled: boolean;
  start: string;
  end: string;
};
