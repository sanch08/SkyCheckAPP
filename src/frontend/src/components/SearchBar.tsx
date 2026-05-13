import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWeatherContext } from "@/context/WeatherContext";
import { useSearchCity } from "@/hooks/useWeather";
import { cn } from "@/lib/utils";
import type { GeoLocation } from "@/types/weather";
import { MapPin, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setSelectedCity } = useWeatherContext();

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results = [], isFetching } = useSearchCity(
    debouncedQuery,
    debouncedQuery.length >= 2,
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (results.length > 0 && debouncedQuery.length >= 2) setOpen(true);
    else if (results.length === 0 && !isFetching) setOpen(false);
  }, [results, debouncedQuery, isFetching]);

  function handleSelect(city: GeoLocation) {
    setSelectedCity(city);
    setQuery(`${city.name}, ${city.country}`);
    setOpen(false);
  }

  function handleClear() {
    setQuery("");
    setDebouncedQuery("");
    setSelectedCity(null);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleListKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      <div className="relative flex items-center">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        <Input
          data-ocid="search.search_input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search for a city..."
          className="pl-10 pr-10 h-12 text-base bg-card border-input shadow-subtle rounded-xl transition-smooth focus-visible:ring-primary"
          aria-label="City search"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-haspopup="listbox"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
            data-ocid="search.clear_button"
          >
            <X size={16} />
          </Button>
        )}
      </div>

      {open && (
        <div
          role="listbox"
          aria-label="City suggestions"
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
          className="absolute top-full mt-2 left-0 right-0 z-50 bg-card border border-border rounded-xl shadow-elevated overflow-hidden"
          data-ocid="search.dropdown_menu"
        >
          {isFetching && (
            <div className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Searching...
            </div>
          )}
          {!isFetching &&
            results.map((city, i) => (
              <div
                key={`${city.latitude}-${city.longitude}`}
                role="option"
                aria-selected={i === activeIndex}
                tabIndex={0}
                onClick={() => handleSelect(city)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(city);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer transition-smooth hover:bg-muted text-sm",
                  i < results.length - 1 && "border-b border-border/50",
                  i === activeIndex && "bg-muted",
                )}
                data-ocid={`search.item.${i + 1}`}
              >
                <MapPin size={14} className="text-primary flex-shrink-0" />
                <span className="font-medium">{city.name}</span>
                <span className="text-muted-foreground ml-auto">
                  {city.country}
                </span>
              </div>
            ))}
          {!isFetching &&
            results.length === 0 &&
            debouncedQuery.length >= 2 && (
              <div
                className="px-4 py-3 text-sm text-muted-foreground"
                data-ocid="search.empty_state"
              >
                No cities found for "{debouncedQuery}"
              </div>
            )}
        </div>
      )}
    </div>
  );
}
