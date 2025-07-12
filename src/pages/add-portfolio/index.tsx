import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import type { User } from '@supabase/supabase-js';
import Header from '../../components/Header';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AddPortfolioPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('Stock');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/');
      return;
    }
    setUser(session.user);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    if (!user) {
      setMessage('You must be signed in to add assets.');
      return;
    }
    const userId = user.id;
    const { error } = await supabase.from('portfolios').insert([
      {
        user_id: userId,
        asset_name: assetName,
        asset_type: assetType,
        quantity: Number(quantity),
        purchase_price: Number(purchasePrice),
      },
    ]);
    setMessage(error ? error.message : 'Asset added to portfolio!');
    if (!error) {
      setAssetName('');
      setAssetType('');
      setQuantity('');
      setPurchasePrice('');
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
        <Header user={user} title="Add Investment" />
        
        <section style={{ maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(74,144,226,0.08)', padding: '2rem' }}>
          <h2 style={{ color: '#4A90E2', fontSize: 20, marginBottom: 24 }}>Add New Asset</h2>
          <form aria-label="Add Asset Form" onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="assetName" style={{ display: 'block', marginBottom: 8, color: '#4A4A4A', fontWeight: 'bold' }}>Asset Name</label>
              <input 
                id="assetName" 
                type="text" 
                value={assetName} 
                onChange={e => setAssetName(e.target.value)} 
                required 
                placeholder="e.g., Apple, AAPL, Bitcoin, Tesla"
                style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }} 
              />
              <div style={{ fontSize: 12, color: '#7f8c8d', marginTop: 4 }}>
                💡 Use stock symbols (AAPL, TSLA) or full names (Apple, Tesla, Bitcoin)
              </div>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="assetType" style={{ display: 'block', marginBottom: 8, color: '#4A4A4A', fontWeight: 'bold' }}>Asset Type</label>
              <select 
                id="assetType" 
                value={assetType} 
                onChange={e => setAssetType(e.target.value)} 
                style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
              >
                <option value="Stock">Stock</option>
                <option value="ETF">ETF</option>
                <option value="Cryptocurrency">Cryptocurrency</option>
                <option value="Bond">Bond</option>
                <option value="Commodity">Commodity</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="quantity" style={{ display: 'block', marginBottom: 8, color: '#4A4A4A', fontWeight: 'bold' }}>Quantity</label>
              <input 
                id="quantity" 
                type="number" 
                step="0.000001"
                value={quantity} 
                onChange={e => setQuantity(e.target.value)} 
                required 
                placeholder="0.00"
                style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }} 
              />
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <label htmlFor="purchasePrice" style={{ display: 'block', marginBottom: 8, color: '#4A4A4A', fontWeight: 'bold' }}>Purchase Price (per unit)</label>
              <input 
                id="purchasePrice" 
                type="number" 
                step="0.01"
                value={purchasePrice} 
                onChange={e => setPurchasePrice(e.target.value)} 
                required 
                placeholder="0.00"
                style={{ width: '100%', padding: 12, borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }} 
              />
              <div style={{ fontSize: 12, color: '#7f8c8d', marginTop: 4 }}>
                💰 Price paid per share/unit (not total investment)
              </div>
            </div>
            
            {/* Total Investment Calculation */}
            {quantity && purchasePrice && (
              <div style={{ 
                background: '#e3f2fd', 
                border: '1px solid #4A90E2', 
                borderRadius: 8, 
                padding: '1rem', 
                marginBottom: 24 
              }}>
                <div style={{ color: '#1976d2', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
                  📊 Investment Summary
                </div>
                <div style={{ color: '#1976d2', fontSize: 16 }}>
                  Total Investment: <strong>${(parseFloat(quantity) * parseFloat(purchasePrice)).toFixed(2)}</strong>
                </div>
                <div style={{ color: '#7f8c8d', fontSize: 12, marginTop: 4 }}>
                  {quantity} units × ${parseFloat(purchasePrice).toFixed(2)} per unit
                </div>
              </div>
            )}
            
            <button 
              type="submit" 
              style={{ 
                background: '#4A90E2', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 6, 
                padding: '12px 24px', 
                fontSize: 16, 
                cursor: 'pointer', 
                width: '100%' 
              }}
            >
              Add Asset to Portfolio
            </button>
          </form>
          
          {message && (
            <div style={{ 
              marginTop: 16, 
              padding: 12, 
              borderRadius: 6,
              background: message.includes('added') ? '#d4edda' : '#f8d7da',
              color: message.includes('added') ? '#155724' : '#721c24',
              border: `1px solid ${message.includes('added') ? '#c3e6cb' : '#f5c6cb'}`
            }}>
              {message}
              {message.includes('added') && (
                <div style={{ marginTop: 8 }}>
                  <button 
                    onClick={() => router.push('/assets')}
                    style={{ 
                      background: '#28a745', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 4, 
                      padding: '6px 12px', 
                      fontSize: 14, 
                      cursor: 'pointer',
                      marginRight: 8
                    }}
                  >
                    View All Assets
                  </button>
                  <button 
                    onClick={() => setMessage('')}
                    style={{ 
                      background: '#6c757d', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 4, 
                      padding: '6px 12px', 
                      fontSize: 14, 
                      cursor: 'pointer' 
                    }}
                  >
                    Add Another
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default AddPortfolioPage;
// NOTE: Ensure the 'portfolios' table exists in Supabase with columns: user_id, asset_name, asset_type, quantity, purchase_price.
