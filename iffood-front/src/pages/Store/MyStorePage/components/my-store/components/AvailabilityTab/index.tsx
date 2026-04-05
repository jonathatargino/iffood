import { useState, useEffect } from "react";
import type { Store } from "@/services/store";
import type { WeekDay } from "../../types";
import { INITIAL_WEEK_DAYS } from "../utils";
import { useUpdateStoreAvailabilities } from "@/pages/Store/MyStorePage/hooks/useStoreMutation";
import { useStoreAvailabilities } from "@/pages/Store/MyStorePage/hooks/useStoreQueries";
import { AvailabilityList } from "./components/AvailabilityList";
import { SectionHeader } from "@/components/SectionHeader";
import { StoreStatusToggleButton } from "./components/StoreStatusToggleButton";
import { getAvailabilityTabSectionDescription } from "./components/utils";

type AvailabilityTabProps = {
  store: Store;
};

export function AvailabilityTab({ store }: AvailabilityTabProps) {
  const [weekDays, setWeekDays] = useState<WeekDay[]>(INITIAL_WEEK_DAYS);

  const { data: availabilities = [], isLoading: loadingAvailabilities } =
    useStoreAvailabilities(store.id, true);

  const updateAvailabilitiesMutation = useUpdateStoreAvailabilities(store.id);

  const handleWeekDayChange = (updatedDay: WeekDay) => {
    setWeekDays(
      weekDays.map((day) =>
        day.weekday === updatedDay.weekday ? updatedDay : day,
      ),
    );
  };

  const handleSaveAvailabilities = () => {
    const availabilitiesToSend = weekDays
      .filter((day) => day.enabled)
      .map((day) => ({
        weekday: day.weekday,
        start: day.start,
        end: day.end,
      }));

    updateAvailabilitiesMutation.mutate(availabilitiesToSend);
  };

  useEffect(() => {
    if (availabilities.length > 0) {
      setWeekDays((current) =>
        current.map((day) => {
          const availability = availabilities.find(
            (a) => a.weekday === day.weekday,
          );
          if (availability) {
            return {
              ...day,
              enabled: true,
              start: availability.start,
              end: availability.end,
            };
          }
          return day;
        }),
      );
    }
  }, [availabilities]);

  return (
    <>
      <SectionHeader
        title="Disponibilidade"
        description={getAvailabilityTabSectionDescription({
          isAvailable: store.isAvailable,
          status: store.status,
        })}
        actions={<StoreStatusToggleButton store={store} />}
      />

      <AvailabilityList
        weekDays={weekDays}
        onWeekDayChange={handleWeekDayChange}
        isLoading={loadingAvailabilities}
        onSaveAvailabilities={handleSaveAvailabilities}
        isUpdateLoading={updateAvailabilitiesMutation.isPending}
      />
    </>
  );
}
