// api/call-action.js — uses profiles + matches(user_a, user_b)

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { action, call_id, user_id, reason } = req.body;

    switch (action) {
      case 'answer':
        await sbFetch(`calls?id=eq.${call_id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'active', answered_at: new Date().toISOString() }),
        });
        return res.json({ ok: true });

      case 'decline':
        await sbFetch(`calls?id=eq.${call_id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'declined', ended_at: new Date().toISOString(), end_reason: 'receiver_hangup' }),
        });
        return res.json({ ok: true });

      case 'missed':
        await sbFetch(`calls?id=eq.${call_id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'missed', ended_at: new Date().toISOString(), end_reason: 'timeout' }),
        });
        return res.json({ ok: true });

      case 'hangup': {
        const { data: call } = await sbFetch(`calls?id=eq.${call_id}&select=caller_id`);
        const isCaller = call[0]?.caller_id === user_id;
        await sbFetch(`calls?id=eq.${call_id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'ended',
            ended_at: new Date().toISOString(),
            end_reason: isCaller ? 'caller_hangup' : 'receiver_hangup',
          }),
        });
        await sbFetch('call_signals', {
          method: 'POST',
          body: JSON.stringify({
            call_id,
            sender: isCaller ? 'caller' : 'receiver',
            signal_type: 'hangup',
            payload: {},
          }),
        });
        return res.json({ ok: true });
      }

      case 'report':
        await sbFetch(`calls?id=eq.${call_id}`, {
          method: 'PATCH',
          body: JSON.stringify({ reported: true, report_reason: reason || 'Reported' }),
        });
        return res.json({ ok: true });

      case 'check-incoming': {
        if (!user_id) return res.status(400).json({ error: 'user_id required' });
        const { data } = await sbFetch(
          `calls?receiver_id=eq.${user_id}&status=eq.ringing&select=id,caller_id,call_type,match_id,started_at&order=created_at.desc&limit=1`
        );
        if (data?.length > 0) {
          const { data: caller } = await sbFetch(
            `profiles?id=eq.${data[0].caller_id}&select=display_name,photos_urls`
          );
          return res.json({
            incoming: true,
            call: {
              ...data[0],
              caller_name: caller[0]?.display_name || 'Someone',
              caller_photo: caller[0]?.photos_urls?.[0] || null,
            },
          });
        }
        return res.json({ incoming: false });
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
