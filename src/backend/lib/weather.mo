import Types "../types/weather";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Int "mo:core/Int";

module {
  // ── URL builders ────────────────────────────────────────────────────────────

  public func buildGeocodingUrl(city : Text) : Text {
    "https://geocoding-api.open-meteo.com/v1/search?name=" # urlEncode(city) # "&count=5"
  };

  public func buildWeatherUrl(
    latitude : Float,
    longitude : Float,
    unit : Types.TemperatureUnit,
  ) : Text {
    let unitStr = switch unit { case (#celsius) "celsius"; case (#fahrenheit) "fahrenheit" };
    let lat = latitude.toText();
    let lon = longitude.toText();
    "https://api.open-meteo.com/v1/forecast" #
    "?latitude=" # lat #
    "&longitude=" # lon #
    "&temperature_unit=" # unitStr #
    "&current=temperature_2m,apparent_temperature,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code" #
    "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,weather_code" #
    "&forecast_days=7" #
    "&timezone=auto"
  };

  // ── Minimal URL percent-encoding for city names ──────────────────────────────

  func urlEncode(s : Text) : Text {
    s.replace(#char ' ', "+")
  };

  // ── Lightweight JSON field extraction ───────────────────────────────────────
  // These helpers scan predictable Open-Meteo JSON for specific field values.

  /// Extract the string value of a JSON key, e.g. "name":"Paris" → "Paris".
  public func extractStringField(json : Text, key : Text) : ?Text {
    let needle = "\"" # key # "\":";
    switch (textIndexOf(json, needle)) {
      case null null;
      case (?pos) {
        let rest = textDrop(json, pos + needle.size());
        let trimmed = rest.trimStart(#char ' ');
        if (trimmed.startsWith(#text "\"")) {
          let inner = textDrop(trimmed, 1);
          ?textTakeBefore(inner, '\"')
        } else {
          null
        }
      };
    }
  };

  /// Extract a numeric (possibly float) field value as Text.
  public func extractNumberField(json : Text, key : Text) : ?Text {
    let needle = "\"" # key # "\":";
    switch (textIndexOf(json, needle)) {
      case null null;
      case (?pos) {
        let rest = textDrop(json, pos + needle.size());
        let trimmed = rest.trimStart(#char ' ');
        ?textTakeWhileNumeric(trimmed)
      };
    }
  };

  /// Find the index of `needle` inside `haystack`, returns offset in characters.
  func textIndexOf(haystack : Text, needle : Text) : ?Nat {
    let hSize = haystack.size();
    let nSize = needle.size();
    if (nSize == 0) return ?0;
    if (nSize > hSize) return null;
    var i : Nat = 0;
    let hChars = haystack.toArray();
    let nChars = needle.toArray();
    while (i + nSize <= hSize) {
      var match = true;
      var j : Nat = 0;
      while (j < nSize) {
        if (hChars[i + j] != nChars[j]) {
          match := false;
          j := nSize; // break
        } else { j += 1 };
      };
      if (match) return ?i;
      i += 1;
    };
    null
  };

  /// Drop the first `n` characters of `t`.
  func textDrop(t : Text, n : Nat) : Text {
    Text.fromIter(t.toIter() |> dropIter(_, n))
  };

  func dropIter<T>(iter : { next : () -> ?T }, n : Nat) : { next : () -> ?T } {
    var dropped = 0;
    while (dropped < n) {
      ignore iter.next();
      dropped += 1;
    };
    iter
  };

  /// Take all leading characters up to (not including) the first `stop` character.
  func textTakeBefore(t : Text, stop : Char) : Text {
    var result = "";
    for (c in t.toIter()) {
      if (c == stop) return result;
      result #= Text.fromChar(c);
    };
    result
  };

  /// Take leading characters that look like a number (digits, '.', '-', 'e', '+').
  func textTakeWhileNumeric(t : Text) : Text {
    var result = "";
    for (c in t.toIter()) {
      if ((c >= '0' and c <= '9') or c == '.' or c == '-' or c == 'e' or c == '+') {
        result #= Text.fromChar(c);
      } else {
        return result;
      };
    };
    result
  };

  /// Parse a Float from Text; returns 0.0 on failure.
  public func parseFloat(t : Text) : Float {
    // Manual float parsing: split on '.', parse integer and fractional parts
    let trimmed = t.trimStart(#char ' ').trimEnd(#char ' ');
    if (trimmed == "" or trimmed == "-") return 0.0;
    let (isNeg, abs) = if (trimmed.startsWith(#text "-")) (true, textDrop(trimmed, 1)) else (false, trimmed);
    let dotPos = textIndexOf(abs, ".");
    switch (dotPos) {
      case null {
        switch (Nat.fromText(abs)) {
          case (?n) { let f = n.toFloat(); if (isNeg) -f else f };
          case null 0.0;
        }
      };
      case (?dp) {
        let intPart = textDrop(abs, 0) |> textTakeBefore(_, '.');
        let fracPart = textDrop(abs, dp + 1);
        let intVal : Float = switch (Nat.fromText(intPart)) {
          case (?n) n.toFloat();
          case null 0.0;
        };
        let fracVal : Float = switch (Nat.fromText(fracPart)) {
          case (?n) {
            var divisor : Float = 1.0;
            var k = fracPart.size();
            while (k > 0) { divisor *= 10.0; k -= 1 };
            n.toFloat() / divisor
          };
          case null 0.0;
        };
        let result = intVal + fracVal;
        if (isNeg) -result else result
      };
    }
  };

  /// Parse a Nat from Text; returns 0 on failure.
  public func parseNat(t : Text) : Nat {
    // Truncate at decimal point for integer-like numbers
    let intPart = textTakeBefore(t, '.');
    let s = if (intPart == "") t else intPart;
    // Handle negative sign (weather codes are non-negative)
    let digits = if (s.startsWith(#text "-")) textDrop(s, 1) else s;
    switch (Nat.fromText(digits)) {
      case (?n) n;
      case null 0;
    }
  };

  // ── Geocoding JSON parser ────────────────────────────────────────────────────

  /// Parse Open-Meteo geocoding JSON response.
  /// Expected structure: {"results":[{"name":"...","country":"...","latitude":...,"longitude":...},...]}
  public func parseGeocodingResponse(json : Text) : Types.ParseResult {
    // Check for empty results
    if (not json.contains(#text "\"results\"")) {
      return #cityNotFound;
    };
    // Split into individual result objects by finding each '{' inside the results array
    let locations = List.empty<Types.GeoLocation>();
    // Extract the results array content
    let resultsKey = "\"results\":";
    switch (textIndexOf(json, resultsKey)) {
      case null { return #cityNotFound };
      case (?pos) {
        let afterResults = textDrop(json, pos + resultsKey.size());
        // Find the '[' and walk through objects
        switch (textIndexOf(afterResults, "[")) {
          case null { return #cityNotFound };
          case (?arrStart) {
            let arrContent = textDrop(afterResults, arrStart + 1);
            parseGeoObjects(arrContent, locations);
          };
        };
      };
    };
    if (locations.size() == 0) {
      return #cityNotFound;
    };
    #ok(locations.toArray())
  };

  func parseGeoObjects(arrContent : Text, out : List.List<Types.GeoLocation>) {
    // Walk through each top-level '{...}' object in the array
    var remaining = arrContent;
    var count = 0;
    while (count < 5) {
      switch (textIndexOf(remaining, "{")) {
        case null { count := 5 }; // break
        case (?startPos) {
          let objText = extractBalancedObject(remaining, startPos);
          switch (parseGeoLocation(objText)) {
            case (?loc) { out.add(loc) };
            case null {};
          };
          // Advance past this object
          let nextStart = startPos + objText.size() + 2; // +2 for '{' and '}'
          if (nextStart >= remaining.size()) {
            count := 5; // break
          } else {
            remaining := textDrop(remaining, nextStart);
            count += 1;
          };
        };
      };
    };
  };

  func extractBalancedObject(text : Text, fromPos : Nat) : Text {
    // Extract text between the outermost '{' and matching '}'
    let chars = text.toArray();
    let len = chars.size();
    var depth = 0;
    var start = fromPos;
    var i = fromPos;
    var _result = "";
    var inString = false;
    var prevBackslash = false;
    while (i < len) {
      let c = chars[i];
      if (prevBackslash) {
        prevBackslash := false;
      } else if (c == '\\') {
        prevBackslash := true;
      } else if (c == '\"') {
        inString := not inString;
      } else if (not inString) {
        if (c == '{') {
          depth += 1;
          if (depth == 1) { start := i };
        } else if (c == '}') {
          depth -= 1;
          if (depth == 0) {
            // Collect characters from start+1 to i-1 (inner content)
            var inner = "";
            var j = start + 1;
            while (j < i) {
              inner #= Text.fromChar(chars[j]);
              j += 1;
            };
            return inner;
          };
        };
      };
      i += 1;
    };
    // fallback: return entire text
    text
  };

  func parseGeoLocation(obj : Text) : ?Types.GeoLocation {
    let name = switch (extractStringField(obj, "name")) { case (?v) v; case null return null };
    let country = switch (extractStringField(obj, "country")) { case (?v) v; case null "" };
    let latStr = switch (extractNumberField(obj, "latitude")) { case (?v) v; case null return null };
    let lonStr = switch (extractNumberField(obj, "longitude")) { case (?v) v; case null return null };
    ?{
      name;
      country;
      latitude = parseFloat(latStr);
      longitude = parseFloat(lonStr);
    }
  };

  // ── Weather JSON parser ──────────────────────────────────────────────────────

  /// Parse Open-Meteo forecast JSON and build a WeatherResponse.
  public func parseWeatherResponse(
    json : Text,
    location : Types.GeoLocation,
    unit : Types.TemperatureUnit,
  ) : ?Types.WeatherResponse {
    // Parse current conditions
    let currentJson = switch (extractSection(json, "current")) {
      case (?s) s;
      case null return null;
    };
    let current = parseCurrent(currentJson, unit);

    // Parse daily forecast
    let dailyJson = switch (extractSection(json, "daily")) {
      case (?s) s;
      case null return null;
    };
    let forecast = parseDaily(dailyJson);

    // Derive alerts from weather codes
    let alerts = deriveAlerts(current.weatherCode, forecast);

    ?{ location; current; forecast; alerts }
  };

  /// Extract the value section of a top-level JSON key that contains an object.
  func extractSection(json : Text, key : Text) : ?Text {
    let needle = "\"" # key # "\":";
    switch (textIndexOf(json, needle)) {
      case null null;
      case (?pos) {
        let after = textDrop(json, pos + needle.size()).trimStart(#char ' ');
        ?extractBalancedObject(after, 0)
      };
    }
  };

  func parseCurrent(obj : Text, unit : Types.TemperatureUnit) : Types.CurrentConditions {
    let temperature = parseFloat(switch (extractNumberField(obj, "temperature_2m")) { case (?v) v; case null "0" });
    let feelsLike = parseFloat(switch (extractNumberField(obj, "apparent_temperature")) { case (?v) v; case null "0" });
    let humidity = parseFloat(switch (extractNumberField(obj, "relative_humidity_2m")) { case (?v) v; case null "0" });
    let pressure = parseFloat(switch (extractNumberField(obj, "surface_pressure")) { case (?v) v; case null "0" });
    let windSpeed = parseFloat(switch (extractNumberField(obj, "wind_speed_10m")) { case (?v) v; case null "0" });
    let windDirection = parseFloat(switch (extractNumberField(obj, "wind_direction_10m")) { case (?v) v; case null "0" });
    let weatherCode = parseNat(switch (extractNumberField(obj, "weather_code")) { case (?v) v; case null "0" });
    {
      temperature;
      feelsLike;
      humidity;
      pressure;
      windSpeed;
      windDirection;
      weatherCode;
      weatherDescription = describeWeatherCode(weatherCode);
      unit;
    }
  };

  /// Parse the daily arrays from Open-Meteo response.
  /// Arrays are extracted by index position across all daily fields.
  func parseDaily(obj : Text) : [Types.DailyForecast] {
    let dates = extractJsonArray(obj, "time");
    let maxTemps = extractJsonArray(obj, "temperature_2m_max");
    let minTemps = extractJsonArray(obj, "temperature_2m_min");
    let precip = extractJsonArray(obj, "precipitation_probability_max");
    let wind = extractJsonArray(obj, "wind_speed_10m_max");
    let codes = extractJsonArray(obj, "weather_code");

    let n = dates.size();
    List.tabulate<Types.DailyForecast>(
      n,
      func(i) {
        let code = parseNat(safeGet(codes, i));
        {
          date = stripQuotes(safeGet(dates, i));
          tempMax = parseFloat(safeGet(maxTemps, i));
          tempMin = parseFloat(safeGet(minTemps, i));
          precipitationProbability = parseFloat(safeGet(precip, i));
          windSpeed = parseFloat(safeGet(wind, i));
          weatherCode = code;
          weatherDescription = describeWeatherCode(code);
        }
      },
    ).toArray()
  };

  func safeGet(arr : [Text], i : Nat) : Text {
    if (i < arr.size()) arr[i] else "0"
  };

  func stripQuotes(t : Text) : Text {
    let s = t.trimStart(#char '\"');
    switch (s.stripEnd(#text "\"")) {
      case (?v) v;
      case null s;
    }
  };

  /// Extract a JSON array of primitives as an array of raw Text tokens.
  func extractJsonArray(obj : Text, key : Text) : [Text] {
    let needle = "\"" # key # "\":";
    switch (textIndexOf(obj, needle)) {
      case null [];
      case (?pos) {
        let after = textDrop(obj, pos + needle.size()).trimStart(#char ' ');
        switch (textIndexOf(after, "[")) {
          case null [];
          case (?arrStart) {
            let inner = textDrop(after, arrStart + 1);
            parseArrayTokens(inner)
          };
        };
      };
    }
  };

  func parseArrayTokens(inner : Text) : [Text] {
    let result = List.empty<Text>();
    var current = "";
    var depth = 0;
    var inStr = false;
    var prev = ' ';
    for (c in inner.toIter()) {
      if (c == ']' and depth == 0 and not inStr) {
        let trimmed = current.trimStart(#char ' ').trimEnd(#char ' ');
        if (trimmed != "") result.add(trimmed);
        return result.toArray();
      } else if (c == ',' and depth == 0 and not inStr) {
        let trimmed = current.trimStart(#char ' ').trimEnd(#char ' ');
        if (trimmed != "") result.add(trimmed);
        current := "";
      } else if (c == '\"' and prev != '\\') {
        inStr := not inStr;
        current #= Text.fromChar(c);
      } else if ((c == '{' or c == '[') and not inStr) {
        depth += 1;
        current #= Text.fromChar(c);
      } else if ((c == '}' or c == ']') and not inStr) {
        depth -= 1;
        current #= Text.fromChar(c);
      } else {
        current #= Text.fromChar(c);
      };
      prev := c;
    };
    result.toArray()
  };

  // ── Alert derivation ─────────────────────────────────────────────────────────

  func deriveAlerts(currentCode : Nat, forecast : [Types.DailyForecast]) : [Types.WeatherAlert] {
    let alerts = List.empty<Types.WeatherAlert>();
    switch (alertFromWeatherCode(currentCode)) {
      case (?a) alerts.add(a);
      case null {};
    };
    for (day in forecast.values()) {
      if (day.weatherCode != currentCode) {
        switch (alertFromWeatherCode(day.weatherCode)) {
          case (?a) {
            // Only add if not already present for this code
            let arr = alerts.toArray();
            var found = false;
            for (x in arr.values()) {
              if (x.weatherCode == a.weatherCode) found := true;
            };
            if (not found) alerts.add(a);
          };
          case null {};
        };
      };
    };
    alerts.toArray()
  };

  public func alertFromWeatherCode(code : Nat) : ?Types.WeatherAlert {
    // WMO codes 55-99 that indicate severe weather
    if (code >= 55 and code <= 57) {
      ?{ severity = "Moderate"; description = "Heavy drizzle or freezing drizzle"; weatherCode = code }
    } else if (code >= 63 and code <= 65) {
      ?{ severity = "Moderate"; description = "Heavy rain"; weatherCode = code }
    } else if (code >= 66 and code <= 67) {
      ?{ severity = "Severe"; description = "Freezing rain"; weatherCode = code }
    } else if (code >= 73 and code <= 75) {
      ?{ severity = "Moderate"; description = "Heavy snowfall"; weatherCode = code }
    } else if (code == 77) {
      ?{ severity = "Moderate"; description = "Snow grains"; weatherCode = code }
    } else if (code >= 82 and code <= 82) {
      ?{ severity = "Moderate"; description = "Heavy rain showers"; weatherCode = code }
    } else if (code >= 85 and code <= 86) {
      ?{ severity = "Moderate"; description = "Heavy snow showers"; weatherCode = code }
    } else if (code >= 95 and code <= 99) {
      ?{ severity = "Severe"; description = "Thunderstorm"; weatherCode = code }
    } else {
      null
    }
  };

  // ── WMO weather code descriptions ───────────────────────────────────────────

  public func describeWeatherCode(code : Nat) : Text {
    if (code == 0) "Clear sky"
    else if (code == 1) "Mainly clear"
    else if (code == 2) "Partly cloudy"
    else if (code == 3) "Overcast"
    else if (code == 45) "Foggy"
    else if (code == 48) "Depositing rime fog"
    else if (code == 51) "Light drizzle"
    else if (code == 53) "Moderate drizzle"
    else if (code == 55) "Dense drizzle"
    else if (code == 56) "Light freezing drizzle"
    else if (code == 57) "Heavy freezing drizzle"
    else if (code == 61) "Slight rain"
    else if (code == 63) "Moderate rain"
    else if (code == 65) "Heavy rain"
    else if (code == 66) "Light freezing rain"
    else if (code == 67) "Heavy freezing rain"
    else if (code == 71) "Slight snowfall"
    else if (code == 73) "Moderate snowfall"
    else if (code == 75) "Heavy snowfall"
    else if (code == 77) "Snow grains"
    else if (code == 80) "Slight rain showers"
    else if (code == 81) "Moderate rain showers"
    else if (code == 82) "Violent rain showers"
    else if (code == 85) "Slight snow showers"
    else if (code == 86) "Heavy snow showers"
    else if (code == 95) "Thunderstorm"
    else if (code == 96) "Thunderstorm with slight hail"
    else if (code == 99) "Thunderstorm with heavy hail"
    else "Unknown conditions"
  };
}
