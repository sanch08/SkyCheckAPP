// TypeScript types matching backend contracts

export type TemperatureUnit = "celsius" | "fahrenheit";

export interface GeoLocation {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface CurrentConditions {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  weatherDescription: string;
  unit: TemperatureUnit;
}

export interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  windSpeed: number;
  weatherCode: number;
  weatherDescription: string;
}

export interface WeatherAlert {
  severity: string;
  description: string;
  weatherCode: number;
}

export interface WeatherResponse {
  location: GeoLocation;
  current: CurrentConditions;
  forecast: DailyForecast[];
  alerts: WeatherAlert[];
}

export type WeatherError =
  | { kind: "cityNotFound" }
  | { kind: "apiError"; message: string }
  | { kind: "parseError"; message: string };

// Parsed JSON from backend string responses
export interface BackendWeatherResult {
  ok?: WeatherResponse;
  err?: BackendWeatherError;
}

export interface BackendWeatherError {
  cityNotFound?: null;
  apiError?: string;
  parseError?: string;
}

export interface BackendSearchResult {
  ok?: GeoLocation[];
  err?: BackendWeatherError;
}

// Weather code to icon/description helpers
export function getWeatherIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 9) return "🌫️";
  if (code <= 19) return "🌦️";
  if (code <= 29) return "⛈️";
  if (code <= 39) return "🌨️";
  if (code <= 49) return "🌫️";
  if (code <= 59) return "🌧️";
  if (code <= 69) return "🌧️";
  if (code <= 79) return "❄️";
  if (code <= 99) return "⛈️";
  return "🌡️";
}

export function getWindDirection(degrees: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(degrees / 45) % 8];
}

export function formatTemp(temp: number, unit: TemperatureUnit): string {
  const rounded = Math.round(temp);
  return unit === "fahrenheit" ? `${rounded}°F` : `${rounded}°C`;
}
