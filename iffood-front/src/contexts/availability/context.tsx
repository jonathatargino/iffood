import { createContext, useContext } from "react";
import type { AvailabilityContextValue } from "./types";

export const AvailabilityContext = createContext<AvailabilityContextValue>({
  isThereAvailableStore: false,
});

export const useAvailability = () => useContext(AvailabilityContext);
