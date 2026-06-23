// ══════════════════════════════════════════════════
// PASTE INTO YOUR EXISTING CHAT PAGE
// Zero keys — all calls go through /api/
// ══════════════════════════════════════════════════

// ── CALL BUTTONS (add to chat header HTML) ──
// <button onclick="startCall('audio')" class="call-btn">📞</button>
// <button onclick="startCall('video')" class="call-btn">📹</button>

async function startCall(callType) {
  const myId = localStorage.getItem('apedate_user_id');
  // conversationId, peerId, peerName should already exist in your chat page scope
  if (!myId || !conversationId || !peerId) return alert('Cannot start call');

  try {
    const res = await fetch('/api/create-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        caller_id: myId,
        receiver_id: peerId,
        call_type: callType,
      }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Could not start call');

    // Navigate to call page
    location.href = `/call.html?call_id=${data.call_id}&type=${callType}&role=caller&conv_id=${conversationId}&my_id=${myId}&peer_id=${peerId}&peer_name=${encodeURIComponent(peerName || '')}`;
  } catch (e) {
    alert('Network error');
  }
}

// ── INCOMING CALL POLLING ──
// Polls /api/call-action check-incoming every 3 seconds
// Shows a confirm dialog when a call comes in
// Put this on every page where user should be reachable

let _incomingPoll = null;

function startIncomingCallListener() {
  const myId = localStorage.getItem('apedate_user_id');
  if (!myId) return;

  _incomingPoll = setInterval(async () => {
    try {
      const res = await fetch('/api/call-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-incoming', user_id: myId }),
      });
      const data = await res.json();

      if (data.incoming && data.call) {
        clearInterval(_incomingPoll); // Stop polling while showing dialog
        const c = data.call;
        const type = c.call_type === 'video' ? 'Video' : 'Voice';

        if (confirm(`📞 ${type} call from ${c.caller_name}\n\nAccept?`)) {
          location.href = `/call.html?call_id=${c.id}&type=${c.call_type}&role=receiver&conv_id=${c.conversation_id}&my_id=${myId}&peer_id=${c.caller_id}&peer_name=${encodeURIComponent(c.caller_name)}`;
        } else {
          await fetch('/api/call-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'decline', call_id: c.id }),
          });
          startIncomingCallListener(); // Resume polling
        }
      }
    } catch (e) { /* silent */ }
  }, 3000);
}

startIncomingCallListener();
