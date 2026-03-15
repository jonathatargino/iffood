import type { WeekDay } from "../types";

export const formatWhatsApp = (value: string): string => {
  const numbers = value.replace(/\D/g, "");

  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
      7,
      11
    )}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(
    7,
    11
  )}`;
};

export const INITIAL_WEEK_DAYS: WeekDay[] = [
  {
    weekday: 1,
    name: "Segunda",
    enabled: false,
    start: "08:00",
    end: "18:00",
  },
  { weekday: 2, name: "Terça", enabled: false, start: "08:00", end: "18:00" },
  {
    weekday: 3,
    name: "Quarta",
    enabled: false,
    start: "08:00",
    end: "18:00",
  },
  {
    weekday: 4,
    name: "Quinta",
    enabled: false,
    start: "08:00",
    end: "18:00",
  },
  { weekday: 5, name: "Sexta", enabled: false, start: "08:00", end: "18:00" },
  {
    weekday: 6,
    name: "Sábado",
    enabled: false,
    start: "08:00",
    end: "18:00",
  },
  {
    weekday: 0,
    name: "Domingo",
    enabled: false,
    start: "08:00",
    end: "18:00",
  },
];
