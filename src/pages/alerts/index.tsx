import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { User } from '@supabase/supabase-js';
import Header from '../../components/Header';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AlertsConfigurationPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/');
          return;
        }
        setUser(session.user);
      } catch (error) {
        console.error('Error checking session:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, [router]);

  if (loading) {
    return (
      <main style={{ fontFamily: 'Roboto, sans-serif', background: '#F5F7FA', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#4A90E2', fontSize: 18 }}>Loading...</div>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: 'Roboto, sans-serif', background: '#F5F7FA', minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Header user={user} title="Alerts Configuration" />
        
        <section style={{ maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(74,144,226,0.08)', padding: '2rem' }}>
          <h2 style={{ color: '#4A90E2', fontSize: 20, marginBottom: 24 }}>Price Alerts & Notifications</h2>
          
          <div style={{ 
            background: '#f8f9fa', 
            border: '1px solid #e9ecef', 
            borderRadius: 8, 
            padding: '1.5rem', 
            textAlign: 'center' 
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
            <h3 style={{ color: '#6c757d', fontSize: 18, marginBottom: 12 }}>Coming Soon</h3>
            <p style={{ color: '#6c757d', fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
              Set up custom price alerts, portfolio threshold notifications, and performance tracking alerts.
              Get notified when your investments hit target prices or experience significant changes.
            </p>
            
            <div style={{ 
              background: '#fff', 
              border: '1px solid #dee2e6', 
              borderRadius: 6, 
              padding: '1rem', 
              marginBottom: 16,
              textAlign: 'left'
            }}>
              <h4 style={{ color: '#495057', fontSize: 14, marginBottom: 8, fontWeight: 'bold' }}>Planned Features:</h4>
              <ul style={{ color: '#6c757d', fontSize: 13, margin: 0, paddingLeft: 20 }}>
                <li>Price target alerts for individual assets</li>
                <li>Portfolio value threshold notifications</li>
                <li>Daily/weekly performance summaries</li>
                <li>Market volatility alerts</li>
                <li>Email and browser notifications</li>
              </ul>
            </div>
            
            <button 
              onClick={() => router.push('/assets')}
              style={{ 
                background: '#4A90E2', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 6, 
                padding: '10px 20px', 
                fontSize: 14, 
                cursor: 'pointer' 
              }}
            >
              Back to Assets
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AlertsConfigurationPage;
