import { createActor } from "@/backend";
import { TemperatureUnit as BackendUnit } from "@/backend";
import type {
  GeoLocation,
  TemperatureUnit,
  WeatherResponse,
} from "@/types/weather";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";

function toBackendUnit(unit: TemperatureUnit): BackendUnit {
  return unit === "fahrenheit" ? BackendUnit.fahrenheit : BackendUnit.celsius;
}

export function useSearchCity(city: string, enabled = true) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<GeoLocation[]>({
    queryKey: ["searchCity", city],
    queryFn: async () => {
      if (!actor || !city.trim()) return [];
      const result = await actor.searchCity(city);
      if (result.__kind__ === "err") {
        const err = result.err;
        if (err.__kind__ === "cityNotFound") return [];
        if (err.__kind__ === "apiError") throw new Error(err.apiError);
        if (err.__kind__ === "parseError") throw new Error(err.parseError);
      }
      return result.__kind__ === "ok" ? result.ok : [];
    },
    enabled: !!actor && !isFetching && enabled && city.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });
}

export function useWeather(
  location: GeoLocation | null,
  unit: TemperatureUnit,
) {
  const { actor, isFetching } = useActor(createActor);

  return useQuery<WeatherResponse>({
    queryKey: ["weather", location?.latitude, location?.longitude, unit],
    queryFn: async () => {
      if (!actor || !location) throw new Error("No location selected");
      const result = await actor.getWeather(location.name, toBackendUnit(unit));
      if (result.__kind__ === "err") {
        const err = result.err;
        if (err.__kind__ === "cityNotFound") throw new Error("City not found");
        if (err.__kind__ === "apiError") throw new Error(err.apiError);
        if (err.__kind__ === "parseError") throw new Error(err.parseError);
      }
      if (result.__kind__ !== "ok") throw new Error("No weather data returned");
      const w = result.ok;
      // Cast bigint weatherCode fields to number for frontend types
      return {
        ...w,
        current: { ...w.current, weatherCode: Number(w.current.weatherCode) },
        forecast: w.forecast.map((d) => ({
          ...d,
          weatherCode: Number(d.weatherCode),
        })),
        alerts: w.alerts.map((a) => ({
          ...a,
          weatherCode: Number(a.weatherCode),
        })),
      } as WeatherResponse;
    },
    enabled: !!actor && !isFetching && !!location,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
}
