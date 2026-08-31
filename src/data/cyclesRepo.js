import { supabase } from '../auth/supabaseClient.js';

function fromRow(row) {
  return { id: row.id, startDate: row.start_date, endDate: row.end_date };
}

export async function listCycles(userId) {
  const { data, error } = await supabase
    .from('cycles')
    .select('id, start_date, end_date')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data.map(fromRow);
}

export async function startCycle(userId, startDate) {
  const { data, error } = await supabase
    .from('cycles')
    .insert({ user_id: userId, start_date: startDate })
    .select('id, start_date, end_date')
    .single();

  if (error) throw error;
  return fromRow(data);
}

export async function endCycle(cycleId, endDate) {
  const { data, error } = await supabase
    .from('cycles')
    .update({ end_date: endDate })
    .eq('id', cycleId)
    .select('id, start_date, end_date')
    .single();

  if (error) throw error;
  return fromRow(data);
}

export async function updateCycle(cycleId, { startDate, endDate }) {
  const { data, error } = await supabase
    .from('cycles')
    .update({ start_date: startDate, end_date: endDate })
    .eq('id', cycleId)
    .select('id, start_date, end_date')
    .single();

  if (error) throw error;
  return fromRow(data);
}

export async function deleteCycle(cycleId) {
  const { error } = await supabase.from('cycles').delete().eq('id', cycleId);
  if (error) throw error;
}
