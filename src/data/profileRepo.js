import { supabase } from '../auth/supabaseClient.js';
import { DEFAULT_SETTINGS } from '../cycle/phaseEngine.js';

const PROFILE_COLUMNS = 'avg_cycle_length, avg_period_length, temperature_unit';

function fromRow(row) {
  return {
    avgCycleLength: row.avg_cycle_length,
    avgPeriodLength: row.avg_period_length,
    temperatureUnit: row.temperature_unit,
  };
}

// Profiles are upserted lazily on first access rather than via a DB trigger —
// simpler to maintain, and RLS still guarantees a user can only touch their own row.
export async function getOrCreateProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return fromRow(data);

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      avg_cycle_length: DEFAULT_SETTINGS.avgCycleLength,
      avg_period_length: DEFAULT_SETTINGS.avgPeriodLength,
    })
    .select(PROFILE_COLUMNS)
    .single();

  if (insertError) throw insertError;
  return fromRow(created);
}

export async function updateProfile(userId, { avgCycleLength, avgPeriodLength, temperatureUnit }) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      avg_cycle_length: avgCycleLength,
      avg_period_length: avgPeriodLength,
      temperature_unit: temperatureUnit,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) throw error;
  return fromRow(data);
}
