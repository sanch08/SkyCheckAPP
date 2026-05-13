module {
  public type TemperatureUnit = { #celsius; #fahrenheit };

  public type GeoLocation = {
    name : Text;
    country : Text;
    latitude : Float;
    longitude : Float;
  };

  public type CurrentConditions = {
    temperature : Float;
    feelsLike : Float;
    humidity : Float;
    pressure : Float;
    windSpeed : Float;
    windDirection : Float;
    weatherCode : Nat;
    weatherDescription : Text;
    unit : TemperatureUnit;
  };

  public type DailyForecast = {
    date : Text;
    tempMax : Float;
    tempMin : Float;
    precipitationProbability : Float;
    windSpeed : Float;
    weatherCode : Nat;
    weatherDescription : Text;
  };

  public type WeatherAlert = {
    severity : Text;
    description : Text;
    weatherCode : Nat;
  };

  public type WeatherResponse = {
    location : GeoLocation;
    current : CurrentConditions;
    forecast : [DailyForecast];
    alerts : [WeatherAlert];
  };

  public type ParseResult = {
    #ok : [GeoLocation];
    #cityNotFound;
  };

  public type WeatherError = {
    #cityNotFound;
    #apiError : Text;
    #parseError : Text;
  };

  public type SearchCityResult = { #ok : [GeoLocation]; #err : WeatherError };
  public type WeatherResult = { #ok : WeatherResponse; #err : WeatherError };
}
