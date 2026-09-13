import { supabase } from '../auth/supabaseClient.js';

function fromRow(row) {
  return {
    id: row.id,
    logDate: row.log_date,
    temperatureCelsius: row.temperature_celsius,
    symptoms: row.symptoms ?? [],
    intimacy: row.intimacy,
    note: row.note ?? '',
  };
}

export async function listDailyLogs(userId, { fromDate, toDate }) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('id, log_date, temperature_celsius, symptoms, intimacy, note')
    .eq('user_id', userId)
    .gte('log_date', fromDate)
    .lte('log_date', toDate)
    .order('log_date', { ascending: true });

  if (error) throw error;
  return data.map(fromRow);
}

export async function upsertDailyLog(userId, logDate, { temperatureCelsius, symptoms, intimacy, note }) {
  const { data, error } = await supabase
    .from('daily_logs')
    .upsert(
      {
        user_id: userId,
        log_date: logDate,
        temperature_celsius: temperatureCelsius,
        symptoms,
        intimacy,
        note,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,log_date' }
    )
    .select('id, log_date, temperature_celsius, symptoms, intimacy, note')
    .single();

  if (error) throw error;
  return fromRow(data);
}
