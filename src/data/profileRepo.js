import { supabase } from '../auth/supabaseClient.js';
import { DEFAULT_SETTINGS } from '../cycle/phaseEngine.js';

function fromRow(row) {
  return { avgCycleLength: row.avg_cycle_length, avgPeriodLength: row.avg_period_length };
}

// Profiles are upserted lazily on first access rather than via a DB trigger —
// simpler to maintain, and RLS still guarantees a user can only touch their own row.
export async function getOrCreateProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('avg_cycle_length, avg_period_length')
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
    .select('avg_cycle_length, avg_period_length')
    .single();

  if (insertError) throw insertError;
  return fromRow(created);
}

export async function updateProfile(userId, { avgCycleLength, avgPeriodLength }) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      avg_cycle_length: avgCycleLength,
      avg_period_length: avgPeriodLength,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('avg_cycle_length, avg_period_length')
    .single();

  if (error) throw error;
  return fromRow(data);
}
