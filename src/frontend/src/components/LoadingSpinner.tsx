import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
  label = "Loading...",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-[3px]",
  };

  return (
    <output
      aria-label={label}
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className,
      )}
    >
      <div
        className={cn(
          "rounded-full border-primary border-t-transparent animate-spin",
          sizeClasses[size],
        )}
      />
      <span className="text-sm text-muted-foreground sr-only">{label}</span>
    </output>
  );
}

export function LoadingCard() {
  return (
    <div
      className="w-full rounded-2xl bg-card border border-border p-8 flex flex-col items-center gap-4"
      data-ocid="weather.loading_state"
    >
      <LoadingSpinner size="lg" label="Fetching weather data..." />
      <p className="text-muted-foreground text-sm animate-pulse">
        Fetching weather data...
      </p>
    </div>
  );
}
