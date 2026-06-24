// api/call-signal.js
// WebRTC signaling via DB polling. Zero keys on client.
// POST: store SDP offer/answer/ICE candidate
// GET:  poll for new signals

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
  return { data: await res.json(), ok: res.ok };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // ── POST: Send a signal ──
    if (req.method === 'POST') {
      const { call_id, sender, signal_type, payload } = req.body;
      if (!call_id || !sender || !signal_type || !payload) {
        return res.status(400).json({ error: 'Missing fields' });
      }
      const insert = await sbFetch('call_signals', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({ call_id, sender, signal_type, payload }),
      });
      if (!insert.ok) return res.status(500).json({ error: 'Failed to store signal' });
      return res.status(200).json({ ok: true, id: insert.data[0]?.id });
    }

    // ── GET: Poll for signals ──
    if (req.method === 'GET') {
      const { call_id, role, after } = req.query;
      if (!call_id || !role) {
        return res.status(400).json({ error: 'call_id and role required' });
      }

      // I'm the caller → I want signals from the receiver, and vice versa
      const wantFrom = role === 'caller' ? 'receiver' : 'caller';
      const afterId = after || '0';

      const result = await sbFetch(
        `call_signals?call_id=eq.${call_id}&sender=eq.${wantFrom}&id=gt.${afterId}&order=id.asc&select=id,signal_type,payload`
      );

      return res.status(200).json({ signals: result.data || [] });
    }

    return res.status(405).json({ error: 'GET or POST only' });
  } catch (err) {
    console.error('call-signal error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
