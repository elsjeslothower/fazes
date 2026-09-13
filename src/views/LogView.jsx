import { useState, useEffect } from 'preact/hooks';
import { useSession } from '../state/session.js';
import { useCycleStore, logPeriodStart, logPeriodEnd, editCycle, removeCycle } from '../state/cycleStore.js';
import { listDailyLogs, upsertDailyLog } from '../data/dailyLogsRepo.js';
import { datesInRange, formatDateOnly } from '../cycle/phaseEngine.js';
import { formatTemperature } from '../cycle/temperature.js';
import { DayLogForm } from '../components/DayLogForm.jsx';
import { LoadingIndicator } from '../components/LoadingIndicator.jsx';

export function LogView() {
  const { session } = useSession();
  const { cycles, profile, loading } = useCycleStore();
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  if (loading) return <LoadingIndicator />;

  const activeCycle = cycles[0]?.endDate ? null : cycles[0];
  const temperatureUnit = profile?.temperatureUnit ?? 'fahrenheit';

  async function handleStart() {
    setBusy(true);
    try {
      await logPeriodStart(session.user.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleEnd(cycleId) {
    setBusy(true);
    try {
      await logPeriodEnd(cycleId);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(cycleId) {
    setBusy(true);
    try {
      await removeCycle(cycleId);
    } finally {
      setBusy(false);
    }
  }

  async function handleEditSave(cycle, startDate, endDate) {
    setBusy(true);
    try {
      await editCycle(cycle.id, { startDate, endDate: endDate || null });
      setEditingId(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="log-view">
      <h1>Cycle history</h1>

      {!activeCycle && (
        <button class="primary-button" onClick={handleStart} disabled={busy}>
          Log period start
        </button>
      )}

      {cycles.length === 0 && <p>No cycles logged yet.</p>}

      <ul class="cycle-list">
        {cycles.map((cycle) =>
          editingId === cycle.id ? (
            <li key={cycle.id} class="cycle-list-item">
              <EditCycleForm
                cycle={cycle}
                onSave={handleEditSave}
                onCancel={() => setEditingId(null)}
                busy={busy}
              />
            </li>
          ) : (
            <li key={cycle.id} class="cycle-list-item">
              <div class="cycle-list-row">
                <div>
                  <strong>{cycle.startDate}</strong>
                  {cycle.endDate ? ` – ${cycle.endDate}` : ' (ongoing)'}
                </div>
                <div class="cycle-list-actions">
                  {!cycle.endDate && (
                    <button onClick={() => handleEnd(cycle.id)} disabled={busy}>
                      End
                    </button>
                  )}
                  <button onClick={() => setEditingId(cycle.id)} disabled={busy}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(cycle.id)} disabled={busy}>
                    Delete
                  </button>
                  <button onClick={() => setExpandedId(expandedId === cycle.id ? null : cycle.id)}>
                    {expandedId === cycle.id ? 'Hide days' : 'Days'}
                  </button>
                </div>
              </div>

              {expandedId === cycle.id && (
                <CycleDays
                  key={cycle.id}
                  userId={session.user.id}
                  cycle={cycle}
                  temperatureUnit={temperatureUnit}
                />
              )}
            </li>
          )
        )}
      </ul>
    </div>
  );
}

function CycleDays({ userId, cycle, temperatureUnit }) {
  const [logsByDate, setLogsByDate] = useState(null);
  const [editingDate, setEditingDate] = useState(null);
  const [busy, setBusy] = useState(false);

  const fromDate = cycle.startDate;
  const toDate = cycle.endDate ?? formatDateOnly(new Date());

  useEffect(() => {
    let cancelled = false;
    listDailyLogs(userId, { fromDate, toDate }).then((logs) => {
      if (cancelled) return;
      setLogsByDate(Object.fromEntries(logs.map((log) => [log.logDate, log])));
    });
    return () => {
      cancelled = true;
    };
  }, [userId, fromDate, toDate]);

  if (logsByDate === null) return <LoadingIndicator label="Loading days…" />;

  async function handleSave(date, values) {
    setBusy(true);
    try {
      const saved = await upsertDailyLog(userId, date, values);
      setLogsByDate((current) => ({ ...current, [date]: saved }));
      setEditingDate(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ul class="day-log-list">
      {datesInRange(fromDate, toDate).map((date) => {
        const log = logsByDate[date] ?? null;

        if (editingDate === date) {
          return (
            <li key={date} class="day-log-item">
              <strong>{date}</strong>
              <DayLogForm
                date={date}
                log={log}
                temperatureUnit={temperatureUnit}
                onSave={handleSave}
                onCancel={() => setEditingDate(null)}
                busy={busy}
              />
            </li>
          );
        }

        const summaryParts = [];
        if (log?.temperatureCelsius != null) {
          summaryParts.push(`${formatTemperature(log.temperatureCelsius, temperatureUnit)}°${temperatureUnit === 'fahrenheit' ? 'F' : 'C'}`);
        }
        if (log?.symptoms?.length) {
          summaryParts.push(`${log.symptoms.length} symptom${log.symptoms.length === 1 ? '' : 's'}`);
        }
        if (log?.intimacy) {
          summaryParts.push('intimacy');
        }
        if (log?.note) {
          summaryParts.push('note');
        }

        return (
          <li key={date} class="day-log-item">
            <button class="day-log-row" onClick={() => setEditingDate(date)}>
              <span>{date}</span>
              <span class="day-log-summary">{summaryParts.length ? summaryParts.join(' · ') : 'Not logged'}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function EditCycleForm({ cycle, onSave, onCancel, busy }) {
  const [startDate, setStartDate] = useState(cycle.startDate);
  const [endDate, setEndDate] = useState(cycle.endDate ?? '');

  return (
    <div class="edit-cycle-form">
      <label>
        Start
        <input type="date" value={startDate} onInput={(e) => setStartDate(e.currentTarget.value)} />
      </label>
      <label>
        End
        <input type="date" value={endDate} onInput={(e) => setEndDate(e.currentTarget.value)} />
      </label>
      <div class="cycle-list-actions">
        <button onClick={() => onSave(cycle, startDate, endDate)} disabled={busy}>
          Save
        </button>
        <button onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}
