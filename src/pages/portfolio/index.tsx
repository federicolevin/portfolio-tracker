import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import type { User } from '@supabase/supabase-js';
import Header from '../../components/Header';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Asset {
  asset_name: string;
  asset_type: string;
  quantity: number;
  purchase_price: number;
}

const PortfolioOverviewPage = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuthAndFetchAssets();
  }, []);

  const checkAuthAndFetchAssets = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/');
      return;
    }
    setUser(session.user);
    await fetchAssets(session.user.id);
  };

  const fetchAssets = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('asset_name, asset_type, quantity, purchase_price')
        .eq('user_id', userId);
        
      if (error) {
        setMessage(error.message);
        setAssets([]);
      } else if (data.length === 0) {
        setMessage('No assets found in your portfolio.');
        setAssets([]);
      } else {
        setMessage('');
        setAssets(data);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
      setMessage('Error loading portfolio');
    } finally {
      setLoading(false);
    }
  };

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
        <Header user={user} title="Portfolio Overview" />
        
        <section style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(74,144,226,0.08)', padding: '2rem' }}>
          {loading ? (
            <div style={{ color: '#2c3e50', fontSize: 16 }}>Loading...</div>
          ) : message ? (
            <div style={{ 
              color: '#2c3e50', 
              fontSize: 16, 
              textAlign: 'center', 
              padding: '3rem' 
            }}>
              {message}
              {message === 'No assets found in your portfolio.' && (
                <div style={{ marginTop: '1rem' }}>
                  <button 
                    onClick={() => router.push('/assets')}
                    style={{ 
                      background: '#4A90E2', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 6, 
                      padding: '12px 24px', 
                      fontSize: 16, 
                      cursor: 'pointer' 
                    }}
                  >
                    Add Your First Asset
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
                <thead>
                  <tr style={{ background: '#F5F7FA' }}>
                    <th style={{ textAlign: 'left', padding: 12, borderBottom: '2px solid #4A90E2', color: '#4A90E2', fontWeight: 'bold' }}>Asset Name</th>
                    <th style={{ textAlign: 'left', padding: 12, borderBottom: '2px solid #4A90E2', color: '#4A90E2', fontWeight: 'bold' }}>Type</th>
                    <th style={{ textAlign: 'right', padding: 12, borderBottom: '2px solid #4A90E2', color: '#4A90E2', fontWeight: 'bold' }}>Quantity</th>
                    <th style={{ textAlign: 'right', padding: 12, borderBottom: '2px solid #4A90E2', color: '#4A90E2', fontWeight: 'bold' }}>Purchase Price (per unit)</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E0E7EF' }}>
                      <td style={{ padding: 12, color: '#2c3e50', fontWeight: 'bold' }}>{asset.asset_name}</td>
                      <td style={{ padding: 12, color: '#2c3e50' }}>
                        <span style={{ 
                          background: '#e3f2fd', 
                          color: '#1976d2', 
                          padding: '4px 8px', 
                          borderRadius: 4, 
                          fontSize: 12, 
                          fontWeight: 'bold' 
                        }}>
                          {asset.asset_type}
                        </span>
                      </td>
                      <td style={{ padding: 12, textAlign: 'right', color: '#2c3e50', fontWeight: '500' }}>{asset.quantity}</td>
                      <td style={{ padding: 12, textAlign: 'right', color: '#2c3e50', fontWeight: '500' }}>${asset.purchase_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default PortfolioOverviewPage;
