import { Check } from "lucide-react";
import type { WeekDay } from "../../../../../types";

type AvailabilityWeekDayRowProps = {
  day: WeekDay;
  onChange: (day: WeekDay) => void;
};

export function AvailabilityWeekDayRow({
  day,
  onChange,
}: AvailabilityWeekDayRowProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-4">
        <button
          onClick={() => onChange({ ...day, enabled: !day.enabled })}
          className={`flex size-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all ${
            day.enabled ? "border-[#FF7622] bg-[#FF7622]" : "border-gray-300"
          }`}
        >
          {day.enabled && (
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          )}
        </button>
        <span className="flex-1 text-[#2e2e2e]">{day.name}</span>
      </div>

      {day.enabled && (
        <div className="flex flex-col gap-2 pl-9">
          <div className="flex items-center gap-2">
            <label className="min-w-[50px] text-xs text-gray-400">Início</label>
            <input
              type="time"
              value={day.start}
              onChange={(e) => onChange({ ...day, start: e.target.value })}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#FF7622]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="min-w-[50px] text-xs text-gray-400">Fim</label>
            <input
              type="time"
              value={day.end}
              onChange={(e) => onChange({ ...day, end: e.target.value })}
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#FF7622]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
