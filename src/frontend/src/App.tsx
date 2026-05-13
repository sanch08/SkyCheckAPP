import { WeatherProvider } from "@/context/WeatherContext";
import WeatherPage from "@/pages/WeatherPage";

export default function App() {
  return (
    <WeatherProvider>
      <WeatherPage />
    </WeatherProvider>
  );
}
