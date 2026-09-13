// Pure temperature conversion/formatting — no DOM, no Supabase. Temperature
// is always stored canonically in Celsius (see supabase/schema.sql), so a
// user changing their display unit later never leaves mixed-unit history;
// these functions handle converting to/from whatever unit they've chosen.

export function celsiusToFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

export function fahrenheitToCelsius(fahrenheit) {
  return ((fahrenheit - 32) * 5) / 9;
}

// For display: canonical Celsius -> the user's preferred unit, as a
// 2-decimal string. Returns null unchanged so callers can show "not logged".
export function formatTemperature(celsiusValue, unit) {
  if (celsiusValue == null) return null;
  const value = unit === 'fahrenheit' ? celsiusToFahrenheit(celsiusValue) : celsiusValue;
  return value.toFixed(2);
}

// For saving: a raw input string in the user's unit -> canonical Celsius
// number. Returns null for empty/invalid input.
export function parseTemperatureInput(inputValue, unit) {
  if (inputValue === '' || inputValue == null) return null;
  const parsed = Number(inputValue);
  if (Number.isNaN(parsed)) return null;
  return unit === 'fahrenheit' ? fahrenheitToCelsius(parsed) : parsed;
}
