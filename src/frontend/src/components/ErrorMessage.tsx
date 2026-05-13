import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export function ErrorMessage({
  title = "Something went wrong",
  message,
  onRetry,
  className,
  compact = false,
}: ErrorMessageProps) {
  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm text-destructive",
          className,
        )}
        role="alert"
        data-ocid="weather.error_state"
      >
        <AlertTriangle size={14} />
        <span>{message}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="ml-1 underline hover:no-underline"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full rounded-2xl bg-destructive/5 border border-destructive/20 p-8 flex flex-col items-center gap-4 text-center",
        className,
      )}
      role="alert"
      data-ocid="weather.error_state"
    >
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle className="text-destructive" size={24} />
      </div>
      <div>
        <h3 className="font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2"
          data-ocid="weather.retry_button"
        >
          <RefreshCw size={14} />
          Try again
        </Button>
      )}
    </div>
  );
}
