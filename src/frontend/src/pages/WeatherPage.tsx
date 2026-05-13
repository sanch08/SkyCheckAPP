import { ErrorMessage } from "@/components/ErrorMessage";
import { LoadingCard } from "@/components/LoadingSpinner";
import { SearchBar } from "@/components/SearchBar";
import { Badge } from "@/components/ui/badge";
import { useWeatherContext } from "@/context/WeatherContext";
import { useWeather } from "@/hooks/useWeather";
import { formatTemp, getWeatherIcon, getWindDirection } from "@/types/weather";
import {
  AlertTriangle,
  Droplets,
  Eye,
  Gauge,
  Thermometer,
  Wind,
} from "lucide-react";

export default function WeatherPage() {
  const { unit, toggleUnit, selectedCity } = useWeatherContext();
  const {
    data: weather,
    isLoading,
    isError,
    error,
    refetch,
  } = useWeather(selectedCity, unit);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-subtle sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌤️</span>
            <h1 className="font-display text-xl font-bold tracking-tight text-gradient-primary">
              SkyView
            </h1>
          </div>
          <button
            type="button"
            onClick={toggleUnit}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border bg-muted hover:bg-primary hover:text-primary-foreground hover:border-primary transition-smooth"
            data-ocid="weather.toggle"
            aria-label={`Switch to ${unit === "celsius" ? "Fahrenheit" : "Celsius"}`}
          >
            °{unit === "celsius" ? "C" : "F"}
            <span className="text-muted-foreground mx-1">↔</span>°
            {unit === "celsius" ? "F" : "C"}
          </button>
        </div>
      </header>

      {/* Hero search area */}
      <div
        className="bg-gradient-sky border-b border-border/50 py-10 px-4"
        style={{
          backgroundImage: !selectedCity
            ? `url('/assets/generated/weather-hero.dim_1200x400.jpg')`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center bottom",
        }}
      >
        <div className="max-w-4xl mx-auto">
          {!selectedCity && (
            <div className="text-center mb-6">
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
                Check the weather anywhere
              </h2>
              <p className="text-muted-foreground">
                Search any city for a 7-day forecast, wind, and alerts
              </p>
            </div>
          )}
          <SearchBar />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-6">
        {!selectedCity && (
          <div
            className="flex flex-col items-center justify-center py-16 gap-4 text-center"
            data-ocid="weather.empty_state"
          >
            <span className="text-6xl">🌍</span>
            <h3 className="font-display text-xl font-semibold text-foreground">
              Search for a city to get started
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Type any city name above and select it to view the current
              conditions and 7-day forecast.
            </p>
          </div>
        )}

        {selectedCity && isLoading && <LoadingCard />}

        {selectedCity && isError && (
          <ErrorMessage
            title="Failed to load weather"
            message={
              error instanceof Error
                ? error.message
                : "Could not fetch weather data"
            }
            onRetry={() => refetch()}
          />
        )}

        {selectedCity && weather && (
          <>
            {/* Alerts */}
            {weather.alerts.length > 0 && (
              <section className="space-y-2" data-ocid="weather.alerts_section">
                {weather.alerts.map((alert, i) => (
                  <div
                    key={`${alert.severity}-${i}`}
                    className="flex items-start gap-3 p-4 rounded-xl bg-destructive/8 border border-destructive/25"
                    data-ocid={`weather.alert.${i + 1}`}
                  >
                    <AlertTriangle
                      className="text-destructive mt-0.5 flex-shrink-0"
                      size={16}
                    />
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-destructive">
                        {alert.severity}
                      </span>
                      <p className="text-sm text-foreground mt-0.5">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Current conditions */}
            <section
              className="bg-card border border-border rounded-2xl p-6 shadow-subtle"
              data-ocid="weather.current_card"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                    {weather.location.name}, {weather.location.country}
                  </p>
                  <div className="flex items-end gap-3">
                    <span className="font-display text-7xl font-bold tracking-tighter text-foreground">
                      {formatTemp(weather.current.temperature, unit)}
                    </span>
                    <div className="mb-3 text-4xl">
                      {getWeatherIcon(weather.current.weatherCode)}
                    </div>
                  </div>
                  <p className="text-muted-foreground capitalize">
                    {weather.current.weatherDescription}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Feels like {formatTemp(weather.current.feelsLike, unit)}
                  </p>
                </div>
              </div>

              {/* Detail grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/60">
                <DetailCard
                  icon={<Wind size={16} />}
                  label="Wind"
                  value={`${Math.round(weather.current.windSpeed)} km/h`}
                  sub={getWindDirection(weather.current.windDirection)}
                />
                <DetailCard
                  icon={<Droplets size={16} />}
                  label="Humidity"
                  value={`${Math.round(weather.current.humidity)}%`}
                />
                <DetailCard
                  icon={<Gauge size={16} />}
                  label="Pressure"
                  value={`${Math.round(weather.current.pressure)} hPa`}
                />
                <DetailCard
                  icon={<Thermometer size={16} />}
                  label="Feels Like"
                  value={formatTemp(weather.current.feelsLike, unit)}
                />
              </div>
            </section>

            {/* 7-day forecast */}
            <section data-ocid="weather.forecast_section">
              <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                7-Day Forecast
              </h3>
              <div className="space-y-2">
                {weather.forecast.map((day, i) => (
                  <div
                    key={day.date}
                    className="bg-card border border-border rounded-xl px-5 py-3 flex items-center gap-4 shadow-subtle"
                    data-ocid={`weather.forecast.item.${i + 1}`}
                  >
                    <span className="text-xl w-8">
                      {getWeatherIcon(day.weatherCode)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground truncate capitalize">
                        {day.weatherDescription}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Wind size={12} className="text-primary" />
                      <span className="text-muted-foreground text-xs">
                        {Math.round(day.windSpeed)} km/h
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-semibold text-foreground">
                        {formatTemp(day.tempMax, unit)}
                      </span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-muted-foreground">
                        {formatTemp(day.tempMin, unit)}
                      </span>
                    </div>
                    {day.precipitationProbability > 20 && (
                      <Badge
                        variant="secondary"
                        className="text-xs gap-1 flex-shrink-0"
                      >
                        <Droplets size={10} />
                        {Math.round(day.precipitationProbability)}%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-muted/40 border-t border-border py-5 mt-auto">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-smooth"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

function DetailCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-muted/50 rounded-xl p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-wide font-medium">
          {label}
        </span>
      </div>
      <p className="font-semibold text-foreground text-lg leading-none">
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
