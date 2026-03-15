import { WeekDayRow } from "./week-day-row";
import type { WeekDay } from "../types";

type AvailabilityListProps = {
  weekDays: WeekDay[];
  onWeekDayChange: (day: WeekDay) => void;
  isLoading: boolean;
};

export function AvailabilityList({
  weekDays,
  onWeekDayChange,
  isLoading,
}: AvailabilityListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 rounded-2xl h-[60px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {weekDays.map((day) => (
        <WeekDayRow key={day.weekday} day={day} onChange={onWeekDayChange} />
      ))}
    </div>
  );
}
