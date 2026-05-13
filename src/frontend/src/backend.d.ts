import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface GeoLocation {
    latitude: number;
    country: string;
    name: string;
    longitude: number;
}
export type WeatherError = {
    __kind__: "cityNotFound";
    cityNotFound: null;
} | {
    __kind__: "parseError";
    parseError: string;
} | {
    __kind__: "apiError";
    apiError: string;
};
export interface WeatherResponse {
    alerts: Array<WeatherAlert>;
    current: CurrentConditions;
    forecast: Array<DailyForecast>;
    location: GeoLocation;
}
export interface WeatherAlert {
    description: string;
    weatherCode: bigint;
    severity: string;
}
export type WeatherResult = {
    __kind__: "ok";
    ok: WeatherResponse;
} | {
    __kind__: "err";
    err: WeatherError;
};
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface DailyForecast {
    date: string;
    tempMax: number;
    tempMin: number;
    weatherDescription: string;
    windSpeed: number;
    weatherCode: bigint;
    precipitationProbability: number;
}
export interface CurrentConditions {
    temperature: number;
    unit: TemperatureUnit;
    weatherDescription: string;
    pressure: number;
    windSpeed: number;
    humidity: number;
    windDirection: number;
    feelsLike: number;
    weatherCode: bigint;
}
export type SearchCityResult = {
    __kind__: "ok";
    ok: Array<GeoLocation>;
} | {
    __kind__: "err";
    err: WeatherError;
};
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export enum TemperatureUnit {
    fahrenheit = "fahrenheit",
    celsius = "celsius"
}
export interface backendInterface {
    getWeather(city: string, unit: TemperatureUnit): Promise<WeatherResult>;
    searchCity(city: string): Promise<SearchCityResult>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
