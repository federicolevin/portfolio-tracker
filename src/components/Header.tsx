import React from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface HeaderProps {
  user: User | null;
  title: string;
  showBackButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, title, showBackButton = true }) => {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
      background: '#fff',
      padding: '1rem 2rem',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(74,144,226,0.08)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {showBackButton && (
          <button
            onClick={() => router.push('/')}
            style={{
              background: '#4A90E2',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            ← Dashboard
          </button>
        )}
        <h1 style={{ color: '#4A90E2', fontSize: 24, margin: 0 }}>{title}</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user && (
          <>
            <span style={{ color: '#4A4A4A' }}>Welcome, {user.email}</span>
            <button
              onClick={handleSignOut}
              style={{
                background: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
