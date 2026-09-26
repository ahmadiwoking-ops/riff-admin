'use client';
import { useState } from 'react';
const API = 'https://web-production-31dae.up.railway.app';

export default function Admin() {
  const [token, setToken] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [stats, setStats] = useState(null);
  const [flags, setFlags] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [search, setSearch] = useState('');
  const [waitlist, setWaitlist] = useState(null);
  const [sending, setSending] = useState(false);

  async function apiFetch(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    return (await fetch(API + path, { ...opts, headers })).json();
  }

  async function login() {
    const data = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (data.token) { setToken(data.token); setLoggedIn(true); loadAll(data.token); }
    else alert('Login failed');
  }

  async function loadAll(t) {
    const h = { Authorization: 'Bearer ' + (t || token) };
    const [s, f, u, w] = await Promise.all([
      fetch(API + '/api/admin/stats', { headers: h }).then(r => r.json()).catch(() => ({})),
      fetch(API + '/api/admin/flags', { headers: h }).then(r => r.json()).catch(() => ({ flags: [] })),
      fetch(API + '/api/admin/users', { headers: h }).then(r => r.json()).catch(() => ({ users: [] })),
      fetch(API + '/api/waitlist', { headers: h }).then(r => r.json()).catch(() => null),
    ]);
    setStats(s); setFlags(f.flags || []); setUsers(u.users || []); setWaitlist(w);
  }

  async function sendLaunchEmail() {
    const dry = await apiFetch('/api/waitlist/broadcast', { method: 'POST', body: JSON.stringify({ dryRun: true }) });
    if (dry.error) { alert(dry.error); return; }
    if (!dry.wouldSend) { alert('Nobody left to email.'); return; }
    const msg = 'Send the launch email to ' + dry.wouldSend + ' people?' +
      (dry.remainingAfter ? ('\n\n' + dry.remainingAfter + ' more would remain for a second run.') : '') +
      '\n\nThis cannot be undone. Check the App Store and Play links are live first.';
    if (!confirm(msg)) return;
    setSending(true);
    const res = await apiFetch('/api/waitlist/broadcast', { method: 'POST', body: JSON.stringify({}) });
    setSending(false);
    if (res.error) { alert(res.error); return; }
    alert('Sent ' + res.sent + '. Failed ' + (res.failed || []).length + '. Remaining ' + res.remaining + '.');
    loadAll();
  }

  async function resolveFlag(id, action) {
    await apiFetch('/api/admin/flags/' + id + '/resolve', { method: 'POST', body: JSON.stringify({ action, notes: action }) });
    loadAll();
  }

  const card = { background: '#151B2B', borderRadius: 16, padding: 20, border: '1px solid #1E2740' };
  const inp = { width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid #1E2740', background: '#151B2B', color: '#E2E8F0', fontSize: 14, outline: 'none', fontFamily: 'inherit' };
  const btn = { padding: '12px 24px', borderRadius: 12, background: '#22D3EE', border: 'none', color: '#000', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };

  if (!loggedIn) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ maxWidth: 360, width: '100%', padding: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>🛡 Riff Admin</h1>
        <p style={{ color: '#64748B', marginBottom: 24 }}>Management dashboard</p>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={{ ...inp, marginBottom: 12 }} />
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" style={{ ...inp, marginBottom: 16 }} onKeyDown={e => e.key === 'Enter' && login()} />
        <button onClick={login} style={{ ...btn, width: '100%' }}>Log in</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ width: 220, background: '#0A0E18', borderRight: '1px solid #1E2740', padding: '20px 16px', flexShrink: 0 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>🛡 Riff Admin</h2>
        {['dashboard', 'users', 'flags', 'subscriptions', 'waitlist'].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 4, cursor: 'pointer', background: tab === t ? 'rgba(34,211,238,0.1)' : 'transparent', color: tab === t ? '#22D3EE' : '#64748B', fontSize: 14, textTransform: 'capitalize' }}>{t}</div>
        ))}
        <div onClick={() => { setLoggedIn(false); setToken(''); }} style={{ padding: '10px 14px', cursor: 'pointer', color: '#EF4444', fontSize: 14, marginTop: 20, borderTop: '1px solid #1E2740', paddingTop: 16 }}>Log out</div>
      </div>
      <div style={{ flex: 1, padding: 32, overflow: 'auto' }}>
        {tab === 'dashboard' && <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Dashboard</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {[['Users', stats?.totalUsers, '#8B5CF6'], ['Active 24h', stats?.activeUsers24h, '#22C55E'], ['Connections', stats?.activeConnections, '#22D3EE'], ['Flags', stats?.pendingFlags, (stats?.pendingFlags || 0) > 0 ? '#EF4444' : '#22C55E']].map(([l, v, c], i) => (
              <div key={i} style={card}><div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>{l}</div><div style={{ fontSize: 36, fontWeight: 800, color: c }}>{v || 0}</div></div>
            ))}
          </div>
        </div>}
        {tab === 'users' && <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Users</h1>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inp, maxWidth: 400 }} />
            <button onClick={() => apiFetch('/api/admin/users?search=' + search).then(d => setUsers(d.users || []))} style={btn}>Search</button>
          </div>
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: '1px solid #1E2740' }}>{['Alias', 'Email', 'Plan', 'Trust', 'Joined'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B' }}>{h}</th>)}</tr></thead>
              <tbody>{users.map(u => <tr key={u.id} style={{ borderBottom: '1px solid #1E2740' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{u.alias}</td>
                <td style={{ padding: '12px 16px', color: '#94A3B8' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}><span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, background: u.plan === 'free' ? '#1E2740' : '#22D3EE22', color: u.plan === 'free' ? '#64748B' : '#22D3EE' }}>{u.plan}</span></td>
                <td style={{ padding: '12px 16px' }}>{u.trustScore === 'green' ? '🟢' : '🟡'}</td>
                <td style={{ padding: '12px 16px', color: '#64748B' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>}
        {tab === 'flags' && <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Safety Flags</h1>
          {flags.length === 0 ? <p style={{ color: '#64748B' }}>All clear 🟢</p> : flags.map(f => (
            <div key={f.id} style={{ ...card, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: f.severity === 'critical' ? '#EF4444' : '#F59E0B' }}>{f.flagType}</span>
                <span style={{ fontSize: 12, color: '#64748B' }}>{f.severity}</span>
              </div>
              <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12 }}>User: {f.user?.alias}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['dismiss', '#1E2740', '#94A3B8'], ['warn', '#F59E0B22', '#F59E0B'], ['ban', '#EF444422', '#EF4444']].map(([a, bg, c]) => (
                  <button key={a} onClick={() => resolveFlag(f.id, a)} style={{ ...btn, background: bg, color: c, padding: '8px 16px', fontSize: 12 }}>{a}</button>
                ))}
              </div>
            </div>
          ))}
        </div>}
        {tab === 'subscriptions' && <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Subscriptions</h1>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[['Free', users.filter(u => u.plan === 'free').length, '#94A3B8'], ['Explorer', users.filter(u => u.plan === 'explorer').length, '#22D3EE'], ['Inner Circle', users.filter(u => u.plan === 'inner_circle').length, '#F59E0B']].map(([n, c, col]) => (
              <div key={n} style={card}><div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>{n}</div><div style={{ fontSize: 36, fontWeight: 800, color: col }}>{c}</div></div>
            ))}
          </div>
        </div>}
        {tab === 'waitlist' && <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Launch waiting list</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[['Total', waitlist ? waitlist.total : 0, '#E2E8F0'], ['Not yet emailed', waitlist ? waitlist.pending : 0, '#22D3EE'], ['Emailed', waitlist ? waitlist.notified : 0, '#4ADE80'], ['Unsubscribed', waitlist ? waitlist.unsubbed : 0, '#94A3B8']].map(([n, c, col]) => (
              <div key={n} style={card}><div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>{n}</div><div style={{ fontSize: 32, fontWeight: 800, color: col }}>{c}</div></div>
            ))}
          </div>
          <button onClick={sendLaunchEmail} disabled={sending || !waitlist || !waitlist.pending} style={{ padding: '12px 22px', borderRadius: 10, border: 'none', background: (!waitlist || !waitlist.pending) ? '#1E2740' : '#8B5CF6', color: (!waitlist || !waitlist.pending) ? '#64748B' : '#fff', fontSize: 14, fontWeight: 700, cursor: (sending || !waitlist || !waitlist.pending) ? 'default' : 'pointer', marginBottom: 24 }}>
            {sending ? 'Sending…' : 'Send launch announcement'}
          </button>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>Sends only to people who have not had it and have not opted out. Safe to run more than once.</div>
          <div style={card}>
            {waitlist && waitlist.entries && waitlist.entries.length ? waitlist.entries.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #1E2740', fontSize: 13 }}>
                <div style={{ flex: 1, color: '#E2E8F0' }}>{e.email}</div>
                <div style={{ width: 110, color: '#64748B' }}>{e.source || '—'}</div>
                <div style={{ width: 90, color: '#64748B' }}>{new Date(e.createdAt).toLocaleDateString()}</div>
                <div style={{ width: 100, textAlign: 'right', color: e.unsubbed ? '#94A3B8' : e.notified ? '#4ADE80' : '#22D3EE' }}>
                  {e.unsubbed ? 'unsubscribed' : e.notified ? 'emailed' : 'waiting'}
                </div>
              </div>
            )) : <div style={{ color: '#64748B', fontSize: 13 }}>Nobody on the list yet.</div>}
          </div>
        </div>}
      </div>
    </div>
  );
}
