export type TabType = "general" | "availability" | "products";

export type WeekDay = {
  weekday: number;
  name: string;
  enabled: boolean;
  start: string;
  end: string;
};
