import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import type { User } from '@supabase/supabase-js';

// TODO: Replace with your actual Supabase project URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        if (event === 'SIGNED_IN') {
          // Redirect to portfolio page after successful sign in
          router.push('/portfolio');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (!error && data.user) {
        // Save user email to profiles table
        await supabase.from('profiles').insert([{ email: data.user.email }]);
      }
      setMessage(error ? error.message : 'Check your email for confirmation link.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setMessage(error ? error.message : 'Signed in successfully!');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <main style={{ fontFamily: 'Roboto, sans-serif', background: '#F5F7FA', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#4A90E2', fontSize: 18 }}>Loading...</div>
      </main>
    );
  }

  // Show authenticated user interface
  if (user) {
    return (
      <main style={{ fontFamily: 'Roboto, sans-serif', background: '#F5F7FA', minHeight: '100vh', padding: '2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: '#fff', padding: '1rem 2rem', borderRadius: 12, boxShadow: '0 2px 8px rgba(74,144,226,0.08)' }}>
            <h1 style={{ color: '#4A90E2', fontSize: 24, margin: 0 }}>Portfolio Tracker</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ color: '#4A4A4A' }}>Welcome, {user.email}</span>
              <button onClick={handleSignOut} style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}>
                Sign Out
              </button>
            </div>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(74,144,226,0.08)', cursor: 'pointer' }} onClick={() => router.push('/portfolio')}>
              <h3 style={{ color: '#4A90E2', marginBottom: '0.5rem' }}>Portfolio Overview</h3>
              <p style={{ color: '#666', margin: 0 }}>View your investment portfolio and current holdings</p>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(74,144,226,0.08)', cursor: 'pointer' }} onClick={() => router.push('/add-portfolio')}>
              <h3 style={{ color: '#4A90E2', marginBottom: '0.5rem' }}>Add Investment</h3>
              <p style={{ color: '#666', margin: 0 }}>Add new assets to your portfolio</p>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(74,144,226,0.08)', cursor: 'pointer' }} onClick={() => router.push('/assets')}>
              <h3 style={{ color: '#4A90E2', marginBottom: '0.5rem' }}>Asset Management</h3>
              <p style={{ color: '#666', margin: 0 }}>Manage your investment assets</p>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(74,144,226,0.08)', cursor: 'pointer' }} onClick={() => router.push('/performance')}>
              <h3 style={{ color: '#4A90E2', marginBottom: '0.5rem' }}>Performance</h3>
              <p style={{ color: '#666', margin: 0 }}>View your portfolio performance and analytics</p>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(74,144,226,0.08)', cursor: 'pointer' }} onClick={() => router.push('/alerts')}>
              <h3 style={{ color: '#4A90E2', marginBottom: '0.5rem' }}>Alerts</h3>
              <p style={{ color: '#666', margin: 0 }}>Configure price alerts and notifications</p>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(74,144,226,0.08)', cursor: 'pointer' }} onClick={() => setShowModal(true)}>
              <h3 style={{ color: '#50E3C2', marginBottom: '0.5rem' }}>Premium Features</h3>
              <p style={{ color: '#666', margin: 0 }}>Subscribe for advanced analytics and features</p>
            </div>
          </div>
        </div>

        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(44,62,80,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 320, boxShadow: '0 2px 16px rgba(74,144,226,0.16)' }}>
              <h2 style={{ color: '#4A90E2', fontSize: 22, marginBottom: 16 }}>Subscribe</h2>
              <p style={{ color: '#4A4A4A', fontSize: 16, marginBottom: 24 }}>Stripe payment modal coming soon...</p>
              <button onClick={() => setShowModal(false)} style={{ background: '#4A90E2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 16, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <main style={{ fontFamily: 'Roboto, sans-serif', background: '#F5F7FA', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <section style={{ width: 350, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(74,144,226,0.08)', padding: '2rem' }}>
        <h1 style={{ color: '#4A90E2', fontSize: 24, marginBottom: 24 }}>Portfolio Tracker</h1>
        <h2 style={{ color: '#4A90E2', fontSize: 20, marginBottom: 24 }}>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
        <form onSubmit={handleAuth} aria-label={isSignUp ? 'Sign Up Form' : 'Sign In Form'}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: 8, color: '#4A4A4A' }}>Email</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: 8, marginBottom: 16, borderRadius: 6, border: '1px solid #4A90E2' }} />
          <label htmlFor="password" style={{ display: 'block', marginBottom: 8, color: '#4A4A4A' }}>Password</label>
          <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: 8, marginBottom: 16, borderRadius: 6, border: '1px solid #4A90E2' }} />
          <button type="submit" style={{ background: '#4A90E2', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 18px', fontSize: 16, cursor: 'pointer', width: '100%' }}>{isSignUp ? 'Sign Up' : 'Sign In'}</button>
        </form>
        <button onClick={() => setIsSignUp(!isSignUp)} style={{ marginTop: 16, background: 'none', color: '#50E3C2', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
        {message && <div style={{ marginTop: 16, color: '#4A4A4A' }}>{message}</div>}
      </section>
    </main>
  );
};

export default AuthPage;
