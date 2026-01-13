import { Check } from "lucide-react";
import type { WeekDay } from "../types";

type WeekDayRowProps = {
  day: WeekDay;
  onChange: (day: WeekDay) => void;
};

export function WeekDayRow({ day, onChange }: WeekDayRowProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-4 mb-3">
        <button
          onClick={() => onChange({ ...day, enabled: !day.enabled })}
          className={`size-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
            day.enabled ? "bg-[#FF7622] border-[#FF7622]" : "border-gray-300"
          }`}
        >
          {day.enabled && (
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          )}
        </button>
        <span className="text-[#2e2e2e] flex-1">{day.name}</span>
      </div>

      {day.enabled && (
        <div className="flex flex-col gap-2 pl-9">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 min-w-[50px]">Início</label>
            <input
              type="time"
              value={day.start}
              onChange={(e) => onChange({ ...day, start: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#FF7622]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 min-w-[50px]">Fim</label>
            <input
              type="time"
              value={day.end}
              onChange={(e) => onChange({ ...day, end: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#FF7622]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
