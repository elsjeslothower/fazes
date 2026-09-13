import { useState } from 'preact/hooks';
import { SYMPTOM_OPTIONS } from '../content/symptoms.js';
import { formatTemperature, parseTemperatureInput } from '../cycle/temperature.js';

// The per-day edit form used inside an expanded cycle in LogView. `log` is
// either an existing daily_logs row (from listDailyLogs) or null if nothing's
// been recorded for this date yet.
export function DayLogForm({ date, log, temperatureUnit, onSave, onCancel, busy }) {
  const [temperature, setTemperature] = useState(
    log ? formatTemperature(log.temperatureCelsius, temperatureUnit) ?? '' : ''
  );
  const [symptoms, setSymptoms] = useState(log?.symptoms ?? []);
  const [intimacy, setIntimacy] = useState(log?.intimacy ?? false);
  const [note, setNote] = useState(log?.note ?? '');

  function toggleSymptom(symptom) {
    setSymptoms((current) =>
      current.includes(symptom) ? current.filter((s) => s !== symptom) : [...current, symptom]
    );
  }

  function handleSave() {
    onSave(date, {
      temperatureCelsius: parseTemperatureInput(temperature, temperatureUnit),
      symptoms,
      intimacy,
      note,
    });
  }

  return (
    <div class="day-log-form">
      <label>
        Temperature ({temperatureUnit === 'fahrenheit' ? '°F' : '°C'})
        <input
          type="number"
          step="0.01"
          value={temperature}
          onInput={(e) => setTemperature(e.currentTarget.value)}
        />
      </label>

      <fieldset class="symptom-grid">
        <legend>Symptoms</legend>
        {SYMPTOM_OPTIONS.map((symptom) => (
          <label key={symptom} class="symptom-option">
            <input
              type="checkbox"
              checked={symptoms.includes(symptom)}
              onChange={() => toggleSymptom(symptom)}
            />
            {symptom}
          </label>
        ))}
      </fieldset>

      <label class="intimacy-toggle">
        <input type="checkbox" checked={intimacy} onChange={(e) => setIntimacy(e.currentTarget.checked)} />
        Intimacy
      </label>

      <label>
        Notes
        <textarea rows="3" value={note} onInput={(e) => setNote(e.currentTarget.value)} />
      </label>

      <div class="cycle-list-actions">
        <button onClick={handleSave} disabled={busy}>
          Save
        </button>
        <button onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}
