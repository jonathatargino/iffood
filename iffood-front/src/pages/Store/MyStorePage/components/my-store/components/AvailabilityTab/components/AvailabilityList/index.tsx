import { Button } from "@/components/Button";
import type { WeekDay } from "../../../../types";
import { AvailabilityWeekDayRow } from "./components/AvailabilityWeekDayRow";
import { CenteredBouncingDots } from "@/components/CenteredBouncingDots";

type AvailabilityListProps = {
  weekDays: WeekDay[];
  onWeekDayChange: (day: WeekDay) => void;
  isLoading: boolean;
  isUpdateLoading: boolean;
  onSaveAvailabilities: () => void;
};

export function AvailabilityList({
  weekDays,
  onWeekDayChange,
  onSaveAvailabilities,
  isLoading,
  isUpdateLoading,
}: AvailabilityListProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-60 flex-col space-y-3">
        <CenteredBouncingDots />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-6 px-6">
      <div className="space-y-3">
        {weekDays.map((day) => (
          <AvailabilityWeekDayRow
            key={day.weekday}
            day={day}
            onChange={onWeekDayChange}
          />
        ))}
      </div>
      <Button
        onClick={onSaveAvailabilities}
        disabled={isUpdateLoading}
        className="w-full"
      >
        {isUpdateLoading ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}
