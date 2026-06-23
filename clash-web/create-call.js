// api/create-call.js — Vercel serverless function
// No keys exposed to client. All DB ops happen server-side.

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pdjnpqyzayidthpfmvjk.supabase.co';
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
  return { data: await res.json(), ok: res.ok, status: res.status };
}

async function sbRpc(fn, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { conversation_id, caller_id, receiver_id, call_type } = req.body;
    if (!conversation_id || !caller_id || !receiver_id || !call_type) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Verify conversation + participants
    const convo = await sbFetch(
      `conversations?id=eq.${conversation_id}&select=participant_1,participant_2`
    );
    if (!convo.ok || !convo.data[0]) return res.status(404).json({ error: 'No conversation' });
    const parts = [convo.data[0].participant_1, convo.data[0].participant_2];
    if (!parts.includes(caller_id) || !parts.includes(receiver_id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Rate limit
    const allowed = await sbRpc('check_call_rate_limit', { p_caller_id: caller_id });
    if (!allowed) return res.status(429).json({ error: 'Max 3 calls/hour' });

    // Missed call abuse
    const missed = await sbRpc('missed_call_count', { p_caller_id: caller_id, p_receiver_id: receiver_id });
    if (missed >= 2) return res.status(429).json({ error: 'Too many missed calls to this person' });

    // No duplicate active calls
    const active = await sbFetch(
      `calls?conversation_id=eq.${conversation_id}&status=in.(ringing,active)&select=id`
    );
    if (active.data?.length > 0) return res.status(409).json({ error: 'Call already active' });

    // Insert call record
    const insert = await sbFetch('calls', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({ conversation_id, caller_id, receiver_id, call_type, status: 'ringing' }),
    });
    if (!insert.ok || !insert.data[0]) return res.status(500).json({ error: 'DB error' });

    return res.status(200).json({ call_id: insert.data[0].id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
