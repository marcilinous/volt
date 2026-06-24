// api/create-call.js — uses matches(user_a, user_b) + profiles

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  return { data: await res.json(), ok: res.ok };
}

async function sbRpc(fn, args) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { match_id, caller_id, receiver_id, call_type } = req.body;
    if (!match_id || !caller_id || !receiver_id || !call_type) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Verify match exists and both users are in it
    const match = await sbFetch(`matches?id=eq.${match_id}&select=user_a,user_b`);
    if (!match.ok || !match.data[0]) return res.status(404).json({ error: 'Match not found' });
    const parts = [match.data[0].user_a, match.data[0].user_b];
    if (!parts.includes(caller_id) || !parts.includes(receiver_id)) {
      return res.status(403).json({ error: 'Not in this match' });
    }

    // Rate limit
    const allowed = await sbRpc('check_call_rate_limit', { p_caller_id: caller_id });
    if (!allowed) return res.status(429).json({ error: 'Max 3 calls/hour' });

    // Missed call abuse
    const missed = await sbRpc('missed_call_count', { p_caller_id: caller_id, p_receiver_id: receiver_id });
    if (missed >= 2) return res.status(429).json({ error: 'Too many missed calls to this person' });

    // No active calls on this match
    const active = await sbFetch(`calls?match_id=eq.${match_id}&status=in.(ringing,active)&select=id`);
    if (active.data?.length > 0) return res.status(409).json({ error: 'Call already active' });

    // Insert call
    const insert = await sbFetch('calls', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({ match_id, caller_id, receiver_id, call_type, status: 'ringing' }),
    });
    if (!insert.ok || !insert.data[0]) return res.status(500).json({ error: 'DB error' });

    return res.status(200).json({ call_id: insert.data[0].id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
