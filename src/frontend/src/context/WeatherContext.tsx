import type { GeoLocation, TemperatureUnit } from "@/types/weather";
import { createContext, useContext, useState } from "react";

interface WeatherContextValue {
  unit: TemperatureUnit;
  toggleUnit: () => void;
  selectedCity: GeoLocation | null;
  setSelectedCity: (city: GeoLocation | null) => void;
}

const WeatherContext = createContext<WeatherContextValue | null>(null);

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const [unit, setUnit] = useState<TemperatureUnit>("celsius");
  const [selectedCity, setSelectedCity] = useState<GeoLocation | null>(null);

  const toggleUnit = () =>
    setUnit((u) => (u === "celsius" ? "fahrenheit" : "celsius"));

  return (
    <WeatherContext.Provider
      value={{ unit, toggleUnit, selectedCity, setSelectedCity }}
    >
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeatherContext(): WeatherContextValue {
  const ctx = useContext(WeatherContext);
  if (!ctx)
    throw new Error("useWeatherContext must be used within WeatherProvider");
  return ctx;
}
