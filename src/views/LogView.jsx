import { useState } from 'preact/hooks';
import { useSession } from '../state/session.js';
import { useCycleStore, logPeriodStart, logPeriodEnd, editCycle, removeCycle } from '../state/cycleStore.js';

export function LogView() {
  const { session } = useSession();
  const { cycles, loading } = useCycleStore();
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);

  if (loading) return <p class="loading">Loading…</p>;

  const activeCycle = cycles[0]?.endDate ? null : cycles[0];

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
              </div>
            </li>
          )
        )}
      </ul>
    </div>
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
