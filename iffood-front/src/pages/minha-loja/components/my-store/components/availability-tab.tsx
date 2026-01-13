import { useState, useEffect } from "react";
import type { Store } from "@/services/store";
import type { WeekDay } from "../types";
import { ConfirmationModal } from "@/components/confirmation-modal";
import {
  useUpdateStoreAvailabilities,
  useUpdateStoreStatus,
} from "../../../hooks/use-store-mutations";
import { useStoreAvailabilities } from "../../../hooks/use-store-queries";
import { StoreStatusSection } from "./store-status-section";
import { AvailabilityList } from "./availability-list";
import { INITIAL_WEEK_DAYS } from "./utils";

type AvailabilityTabProps = {
  store: Store;
};

export function AvailabilityTab({ store }: AvailabilityTabProps) {
  const [weekDays, setWeekDays] = useState<WeekDay[]>(INITIAL_WEEK_DAYS);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(false);

  const { data: availabilities = [], isLoading: loadingAvailabilities } =
    useStoreAvailabilities(store.id, true);

  const updateAvailabilitiesMutation = useUpdateStoreAvailabilities(store.id);
  const updateStatusMutation = useUpdateStoreStatus(store.id, store);

  const handleWeekDayChange = (updatedDay: WeekDay) => {
    setWeekDays(
      weekDays.map((day) =>
        day.weekday === updatedDay.weekday ? updatedDay : day
      )
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

  const handleStatusToggle = () => {
    setPendingStatus(!store.status);
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    updateStatusMutation.mutate(pendingStatus);
    setShowStatusModal(false);
  };

  useEffect(() => {
    if (availabilities.length > 0) {
      setWeekDays((current) =>
        current.map((day) => {
          const availability = availabilities.find(
            (a) => a.weekday === day.weekday
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
        })
      );
    }
  }, [availabilities]);

  return (
    <>
      <div className="space-y-6">
        <StoreStatusSection store={store} onToggleStatus={handleStatusToggle} />

        <AvailabilityList
          weekDays={weekDays}
          onWeekDayChange={handleWeekDayChange}
          isLoading={loadingAvailabilities}
        />

        <button
          onClick={handleSaveAvailabilities}
          disabled={updateAvailabilitiesMutation.isPending}
          className="w-full bg-gradient-to-r from-[#FF7622] to-[#E6661A] text-white py-4 rounded-full uppercase transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
        >
          {updateAvailabilitiesMutation.isPending ? "Salvando..." : "Salvar"}
        </button>
      </div>

      <ConfirmationModal
        isOpen={showStatusModal}
        title={pendingStatus ? "Ativar Loja" : "Desativar Loja"}
        message={
          pendingStatus
            ? "Você tem certeza que deseja ativar a loja? Seus produtos serão exibidos para os usuários."
            : "Você tem certeza que deseja deixar a loja inativa? Seus produtos não serão exibidos para os usuários e você não receberá novos pedidos."
        }
        confirmText={pendingStatus ? "Ativar" : "Desativar"}
        cancelText="Cancelar"
        onConfirm={confirmStatusChange}
        onCancel={() => setShowStatusModal(false)}
        variant={pendingStatus ? "default" : "danger"}
        isLoading={updateStatusMutation.isPending}
      />
    </>
  );
}
