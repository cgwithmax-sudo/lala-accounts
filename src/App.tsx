// src/App.tsx
import React, { useEffect, useState } from 'react';
import TicTacToe from './games/TicTacToe';
import MiniTetris from './games/MiniTetris';

type User = { name: string; username: string; role: string };
type LoginOk = { ok: true; user: User };
type LoginErr = { ok: false; error: string };

// If Vercel, API lives on same domain, so empty base works.
// Locally you can set VITE_API_BASE="http://localhost:5173/api" (or similar).
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta as any).env?.VITE_API_BASE ||
  '';

export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState<string | null>(null);
  const [authed, setAuthed]   = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Restore session
  useEffect(() => {
    const s = sessionStorage.getItem('lala_login_user');
    if (s) setAuthed(JSON.parse(s));
  }, []);

  // Persist session
  useEffect(() => {
    if (authed) sessionStorage.setItem('lala_login_user', JSON.stringify(authed));
    else sessionStorage.removeItem('lala_login_user');
  }, [authed]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setAuthed(null);
    try {
      const uname = username.trim();
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
        body: JSON.stringify({ username: uname, password }),
      });
      const json: LoginOk | LoginErr = await res.json();
      if (!json.ok) {
        setError(json.error);
        setLoading(false);
        return;
      }
      const cleanRole = (json.user.role || 'Regular').trim() || 'Regular';
      setAuthed({ ...json.user, role: cleanRole });
      setUsername('');
      setPassword('');
    } catch (err: any) {
      console.error(err);
      setError('Network error. Is the API running?');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setAuthed(null);
  }

  // ---- Live Role Refresh (calls /api/user) ----
  async function refreshRole() {
    if (!authed?.username) return;
    setRefreshing(true);
    try {
      const res = await fetch(
        `${API_BASE}/user?username=${encodeURIComponent(authed.username)}`,
        { headers: { 'Cache-Control': 'no-store' } }
      );
      const json = await res.json();
      if (json?.ok && json.user) {
        const cleanRole = (json.user.role || 'Regular').trim() || 'Regular';
        setAuthed({ ...json.user, role: cleanRole });
      }
    } catch (e) {
      console.warn('Failed to refresh role', e);
    } finally {
      setRefreshing(false);
    }
  }

  // Optional: auto-refresh role when window regains focus
  useEffect(() => {
    function onFocus() {
      if (authed?.username) refreshRole();
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed?.username]);

  const card: React.CSSProperties = {
    background: 'white',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 6px 20px rgba(2,6,23,0.08)',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f6f7fb',
      }}
    >
      <div style={{ width: 420, maxWidth: '100%', padding: 20 }}>
        <div style={card}>
          <h2 style={{ margin: 0, marginBottom: 8 }}>Lala Accounts</h2>
          <p style={{ marginTop: 0, color: '#6b7280' }}>
            Sign in with your Notion account from the <strong>User Info</strong> DB.
          </p>

          {authed ? (
            <>
              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  background: '#f9fafb',
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Signed in as</div>
                    <div style={{ fontWeight: 700 }}>
                      {authed.name || authed.username}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        border: '1px solid #e5e7eb',
                        background: 'white',
                      }}
                    >
                      Role: {authed.role || 'Regular'}
                    </div>
                    <button
                      onClick={refreshRole}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 10,
                        border: '1px solid #e5e7eb',
                        background: 'white',
                        fontWeight: 600,
                        opacity: refreshing ? 0.6 : 1,
                        pointerEvents: refreshing ? 'none' : 'auto',
                      }}
                      title="Refresh role from Notion"
                    >
                      {refreshing ? 'Refreshing…' : 'Refresh'}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1px solid #111827',
                      fontWeight: 600,
                    }}
                  >
                    Log out
                  </button>
                </div>
              </div>

              {/* Role-gated games */}
              {authed.role === 'Admin' ? (
                <section>
                  <h3 style={{ marginTop: 0 }}>XOXO (Admin only)</h3>
                  <p style={{ marginTop: 0, color: '#6b7280' }}>
                    Classic Tic-Tac-Toe. First to 3 in a row wins.
                  </p>
                  <TicTacToe />
                </section>
              ) : (
                <section>
                  <h3 style={{ marginTop: 0 }}>Mini Tetris (Regular)</h3>
                  <p style={{ marginTop: 0, color: '#6b7280' }}>
                    Arrow keys to move, ↑ to rotate, Space to drop.
                  </p>
                  <MiniTetris />
                </section>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>
                  Username
                </label>
                <input
                  placeholder="e.g. cmsm94"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                  }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>
                  Password
                </label>
                <input
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                  }}
                />
              </div>
              {error && (
                <div
                  style={{
                    color: '#b91c1c',
                    padding: 8,
                    borderRadius: 8,
                    background: '#fff7f7',
                    marginBottom: 10,
                  }}
                >
                  {error}
                </div>
              )}
              <div>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid #111827',
                    fontWeight: 700,
                    opacity: loading ? 0.6 : 1,
                    pointerEvents: loading ? 'none' : 'auto',
                  }}
                >
                  {loading ? 'Checking with Notion…' : 'Sign in'}
                </button>
              </div>
            </form>
          )}

          <div style={{ marginTop: 12, fontSize: 12, color: '#9ca3af' }}>
            Every login click checks Notion live.
          </div>
        </div>
      </div>
    </div>
  );
}
