import { API_BASE_URL } from "../../../config/port";


// -------------------------
// DEFAULT DATA
// -------------------------
export const DEFAULT_ZONES = [
  { zone: 5, label: 'Zone 5 (Anaerobic)', value: '0%', color: 'bg-red-500' },
  { zone: 4, label: 'Zone 4 (Threshold)', value: '0%', color: 'bg-orange-400' },
  { zone: 2, label: 'Zone 2 (Aerobic Base)', value: '0%', color: 'bg-[#D1FD52]' },
];

// -------------------------
// ZONES
// -------------------------
export async function fetchZonesFromAPI(userId, timeframe) {
  const res = await fetch(
    `${API_BASE_URL}/api/analytics/zones/${userId}?timeframe=${timeframe.toLowerCase()}`
  );
  return res.json();
}

// -------------------------
// SCATTER DATA
// -------------------------
export async function fetchScatterData(userId, timeframe) {
  const res = await fetch(
    `${API_BASE_URL}/api/sleep/${userId}/scatter?timeframe=${timeframe.toLowerCase()}`
  );
  return res.json();
}

// -------------------------
// TODAY SLEEP
// -------------------------
export async function fetchTodaySleep(userId) {
  const res = await fetch(`${API_BASE_URL}/api/sleep/${userId}/today`);
  return res.json();
}

// -------------------------
// SAVE SLEEP
// -------------------------
export async function saveSleepData(userId, payload) {
  const res = await fetch(`${API_BASE_URL}/api/sleep/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('Save failed');
  return res.json();
}