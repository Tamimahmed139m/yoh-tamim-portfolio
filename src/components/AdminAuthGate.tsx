import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { Game, GameCategory } from '../types/game';

interface Props { games: Game[]; categories: GameCategory[]; favoritesCount: number; onRefreshCatalog: () => void; }

export const AdminAuthGate: React.FC<Props> = ({ games, categories, favoritesCount, onRefreshCatalog }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<any>(null);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const { data: admin } = await supabase.from('admin_users').select('user_id').eq('user_id', data.session.user.id).maybeSingle();
        setSession(data.session);
        setAllowed(Boolean(admin));
      }
      setLoading(false);
    });
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    if (!supabase) { setError('Supabase is not configured.'); setLoading(false); return; }
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data.session) { setError(authError?.message || 'Login failed.'); setLoading(false); return; }
    const { data: admin } = await supabase.from('admin_users').select('user_id').eq('user_id', data.session.user.id).maybeSingle();
    if (!admin) { await supabase.auth.signOut(); setError('This account is not authorized as an admin.'); setLoading(false); return; }
    setSession(data.session); setAllowed(true); setLoading(false);
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-neutral-400">Checking admin access…</div>;
  if (!supabase) return <div className="max-w-md mx-auto py-24 px-6 text-center text-neutral-300">Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</div>;
  if (!session || !allowed) return (
    <div className="max-w-md mx-auto py-24 px-6">
      <form onSubmit={login} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-2">Admin Login</h2>
        <p className="text-sm text-neutral-400 mb-6">Sign in with the Supabase admin account.</p>
        <input className="w-full mb-3 rounded-xl bg-neutral-800 px-4 py-3 text-white" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full mb-4 rounded-xl bg-neutral-800 px-4 py-3 text-white" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
        <button className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-3 font-semibold text-white">Sign in</button>
      </form>
    </div>
  );
  return <AdminDashboardPage games={games} categories={categories} favoritesCount={favoritesCount} onRefreshCatalog={onRefreshCatalog} />;
};
