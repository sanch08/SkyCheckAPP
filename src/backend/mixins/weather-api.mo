import OutCall "mo:caffeineai-http-outcalls/outcall";
import Types "../types/weather";
import WeatherLib "../lib/weather";

mixin () {
  /// Transform callback required by the IC HTTP outcall mechanism — strips headers.
  public query func transform(
    input : OutCall.TransformationInput
  ) : async OutCall.TransformationOutput {
    OutCall.transform(input)
  };

  /// Search for cities matching the given name.
  /// Returns up to 5 matching GeoLocation results.
  public func searchCity(city : Text) : async Types.SearchCityResult {
    if (city.size() == 0) return #err(#cityNotFound);
    let url = WeatherLib.buildGeocodingUrl(city);
    let json = try {
      await OutCall.httpGetRequest(url, [], transform)
    } catch (_) {
      return #err(#apiError("Failed to reach geocoding API"));
    };
    switch (WeatherLib.parseGeocodingResponse(json)) {
      case (#ok(locs)) #ok(locs);
      case (#cityNotFound) #err(#cityNotFound);
    }
  };

  /// Fetch full 7-day weather for a city with given temperature unit.
  public func getWeather(city : Text, unit : Types.TemperatureUnit) : async Types.WeatherResult {
    if (city.size() == 0) return #err(#cityNotFound);
    // Step 1: geocode
    let geoUrl = WeatherLib.buildGeocodingUrl(city);
    let geoJson = try {
      await OutCall.httpGetRequest(geoUrl, [], transform)
    } catch (_) {
      return #err(#apiError("Failed to reach geocoding API"));
    };
    let location = switch (WeatherLib.parseGeocodingResponse(geoJson)) {
      case (#cityNotFound) return #err(#cityNotFound);
      case (#ok(locs)) {
        if (locs.size() == 0) return #err(#cityNotFound);
        locs[0]
      };
    };
    // Step 2: fetch forecast
    let weatherUrl = WeatherLib.buildWeatherUrl(location.latitude, location.longitude, unit);
    let weatherJson = try {
      await OutCall.httpGetRequest(weatherUrl, [], transform)
    } catch (_) {
      return #err(#apiError("Failed to reach weather API"));
    };
    switch (WeatherLib.parseWeatherResponse(weatherJson, location, unit)) {
      case (?response) #ok(response);
      case null #err(#parseError("Failed to parse weather response"));
    }
  };
}
