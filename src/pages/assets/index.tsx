import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import type { User } from '@supabase/supabase-js';
import { fetchMultipleAssetPrices, calculatePerformance, type PriceData } from '../../services/priceService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Asset {
  id: string;
  asset_name: string;
  asset_type: string;
  quantity: number;
  purchase_price: number;
  created_at: string;
}

interface AssetWithPrice extends Asset {
  currentPrice?: number;
  priceData?: PriceData;
  performance?: {
    currentValue: number;
    costBasis: number;
    gainLoss: number;
    gainLossPercent: number;
    dayChangeValue: number;
  };
}

const AssetManagementPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [assets, setAssets] = useState<AssetWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState({
    asset_name: '',
    asset_type: 'Stock',
    quantity: '',
    purchase_price: ''
  });
  const [message, setMessage] = useState('');
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (assets.length > 0) {
      fetchPrices();
    }
  }, [assets.length]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/');
      return;
    }
    setUser(session.user);
    loadAssets(session.user.id);
  };

  const loadAssets = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error loading assets:', error);
      setMessage('Error loading assets');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    if (assets.length === 0) return;
    
    setPricesLoading(true);
    try {
      const assetNames = assets.map(asset => asset.asset_name);
      const priceData = await fetchMultipleAssetPrices(assetNames);
      
      const assetsWithPrices = assets.map(asset => {
        const price = priceData[asset.asset_name];
        if (price) {
          const performance = calculatePerformance(
            asset.quantity,
            asset.purchase_price,
            price.currentPrice,
            price.change
          );
          
          return {
            ...asset,
            currentPrice: price.currentPrice,
            priceData: price,
            performance
          };
        }
        return asset;
      });
      
      setAssets(assetsWithPrices);
      setLastPriceUpdate(new Date());
    } catch (error) {
      console.error('Error fetching prices:', error);
      setMessage('Error fetching current prices');
    } finally {
      setPricesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const assetData = {
        user_id: user.id,
        asset_name: formData.asset_name,
        asset_type: formData.asset_type,
        quantity: parseFloat(formData.quantity),
        purchase_price: parseFloat(formData.purchase_price)
      };

      if (editingAsset) {
        // Update existing asset
        const { error } = await supabase
          .from('portfolios')
          .update(assetData)
          .eq('id', editingAsset.id);

        if (error) throw error;
        setMessage('Asset updated successfully!');
      } else {
        // Add new asset
        const { error } = await supabase
          .from('portfolios')
          .insert([assetData]);

        if (error) throw error;
        setMessage('Asset added successfully!');
      }

      // Reset form and reload assets
      setFormData({ asset_name: '', asset_type: 'Stock', quantity: '', purchase_price: '' });
      setShowAddForm(false);
      setEditingAsset(null);
      loadAssets(user.id);
    } catch (error) {
      console.error('Error saving asset:', error);
      setMessage('Error saving asset');
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      asset_name: asset.asset_name,
      asset_type: asset.asset_type,
      quantity: asset.quantity.toString(),
      purchase_price: asset.purchase_price.toString()
    });
    setShowAddForm(true);
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
      setMessage('Asset deleted successfully!');
      loadAssets(user!.id);
    } catch (error) {
      console.error('Error deleting asset:', error);
      setMessage('Error deleting asset');
    }
  };

  const cancelEdit = () => {
    setEditingAsset(null);
    setShowAddForm(false);
    setFormData({ asset_name: '', asset_type: 'Stock', quantity: '', purchase_price: '' });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
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
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: '#fff', padding: '1rem 2rem', borderRadius: 12, boxShadow: '0 2px 8px rgba(74,144,226,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => router.push('/')} style={{ background: '#4A90E2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}>
              ← Dashboard
            </button>
            <h1 style={{ color: '#4A90E2', fontSize: 24, margin: 0 }}>Asset Management</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#4A4A4A' }}>Welcome, {user?.email}</span>
            <button onClick={handleSignOut} style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        </header>

        {message && (
          <div style={{ background: '#d4edda', color: '#155724', padding: '1rem', borderRadius: 6, marginBottom: '1rem', border: '1px solid #c3e6cb' }}>
            {message}
          </div>
        )}

        {/* Add Asset Button */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            style={{ background: '#50E3C2', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 24px', fontSize: 16, cursor: 'pointer' }}
          >
            {showAddForm ? 'Cancel' : '+ Add New Asset'}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {lastPriceUpdate && (
              <span style={{ color: '#7f8c8d', fontSize: 14 }}>
                Last updated: {lastPriceUpdate.toLocaleTimeString()}
              </span>
            )}
            <button 
              onClick={fetchPrices}
              disabled={pricesLoading}
              style={{ 
                background: pricesLoading ? '#ccc' : '#4A90E2', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 6, 
                padding: '8px 16px', 
                fontSize: 14, 
                cursor: pricesLoading ? 'not-allowed' : 'pointer' 
              }}
            >
              {pricesLoading ? 'Updating...' : '🔄 Refresh Prices'}
            </button>
          </div>
        </div>

        {/* Add/Edit Asset Form */}
        {showAddForm && (
          <section style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(74,144,226,0.08)', padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ color: '#4A90E2', fontSize: 20, marginBottom: 24 }}>
              {editingAsset ? 'Edit Asset' : 'Add New Asset'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#4A4A4A', fontWeight: 'bold' }}>Asset Name</label>
                  <input 
                    type="text" 
                    value={formData.asset_name}
                    onChange={(e) => setFormData({...formData, asset_name: e.target.value})}
                    required 
                    placeholder="e.g., Apple, AAPL, Bitcoin, Tesla, NVDA"
                    style={{ width: '100%', padding: '12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }} 
                  />
                  <div style={{ fontSize: 12, color: '#7f8c8d', marginTop: 4 }}>
                    💡 Use stock symbols (AAPL, TSLA) or full names (Apple, Tesla, Bitcoin)
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#4A4A4A', fontWeight: 'bold' }}>Asset Type</label>
                  <select 
                    value={formData.asset_type}
                    onChange={(e) => setFormData({...formData, asset_type: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }}
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
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#4A4A4A', fontWeight: 'bold' }}>Quantity</label>
                  <input 
                    type="number" 
                    step="0.000001"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required 
                    placeholder="0.00"
                    style={{ width: '100%', padding: '12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, color: '#4A4A4A', fontWeight: 'bold' }}>Purchase Price (per unit)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({...formData, purchase_price: e.target.value})}
                    required 
                    placeholder="0.00"
                    style={{ width: '100%', padding: '12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14 }} 
                  />
                  <div style={{ fontSize: 12, color: '#7f8c8d', marginTop: 4 }}>
                    💰 Price paid per share/unit (not total investment)
                  </div>              </div>
              
              {/* Total Investment Calculation */}
              {formData.quantity && formData.purchase_price && (
                <div style={{ 
                  background: '#e3f2fd', 
                  border: '1px solid #4A90E2', 
                  borderRadius: 8, 
                  padding: '1rem', 
                  marginBottom: '1.5rem',
                  gridColumn: '1 / -1'
                }}>
                  <div style={{ color: '#1976d2', fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
                    📊 Investment Summary
                  </div>
                  <div style={{ color: '#1976d2', fontSize: 16 }}>
                    Total Investment: <strong>${(parseFloat(formData.quantity) * parseFloat(formData.purchase_price)).toFixed(2)}</strong>
                  </div>
                  <div style={{ color: '#7f8c8d', fontSize: 12, marginTop: 4 }}>
                    {formData.quantity} units × ${parseFloat(formData.purchase_price).toFixed(2)} per unit
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" style={{ background: '#4A90E2', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 24px', fontSize: 16, cursor: 'pointer' }}>
                  {editingAsset ? 'Update Asset' : 'Add Asset'}
                </button>
                {editingAsset && (
                  <button type="button" onClick={cancelEdit} style={{ background: '#6c757d', color: '#fff', border: 'none', borderRadius: 6, padding: '12px 24px', fontSize: 16, cursor: 'pointer' }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>
        )}

        {/* Assets List */}
        <section style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(74,144,226,0.08)', padding: '2rem' }}>
          <h2 style={{ color: '#4A90E2', fontSize: 20, marginBottom: 24 }}>Your Assets ({assets.length})</h2>
          
          {assets.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#7f8c8d', padding: '3rem' }}>
              <p style={{ fontSize: 18, marginBottom: '1rem', color: '#2c3e50', fontWeight: '500' }}>No assets found</p>
              <p style={{ color: '#7f8c8d' }}>Click "Add New Asset" to get started with your portfolio</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f1f1' }}>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#4A90E2', fontWeight: 'bold' }}>Asset Name</th>
                    <th style={{ textAlign: 'left', padding: '12px', color: '#4A90E2', fontWeight: 'bold' }}>Type</th>
                    <th style={{ textAlign: 'right', padding: '12px', color: '#4A90E2', fontWeight: 'bold' }}>Quantity</th>
                    <th style={{ textAlign: 'right', padding: '12px', color: '#4A90E2', fontWeight: 'bold' }}>Purchase Price (per unit)</th>
                    <th style={{ textAlign: 'right', padding: '12px', color: '#4A90E2', fontWeight: 'bold' }}>Current Price</th>
                    <th style={{ textAlign: 'right', padding: '12px', color: '#4A90E2', fontWeight: 'bold' }}>Current Value</th>
                    <th style={{ textAlign: 'right', padding: '12px', color: '#4A90E2', fontWeight: 'bold' }}>Gain/Loss</th>
                    <th style={{ textAlign: 'right', padding: '12px', color: '#4A90E2', fontWeight: 'bold' }}>Day Change</th>
                    <th style={{ textAlign: 'center', padding: '12px', color: '#4A90E2', fontWeight: 'bold' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => {
                    const hasPrice = asset.currentPrice !== undefined;
                    const performance = asset.performance;
                    
                    return (
                      <tr key={asset.id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                        <td style={{ padding: '12px', color: '#2c3e50', fontWeight: 'bold' }}>
                          <div>
                            {asset.asset_name}
                            {asset.priceData && (
                              <div style={{ fontSize: 12, color: '#7f8c8d' }}>
                                {asset.priceData.symbol}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px', color: '#2c3e50' }}>
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
                        <td style={{ padding: '12px', textAlign: 'right', color: '#2c3e50', fontWeight: '500' }}>{asset.quantity}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#2c3e50', fontWeight: '500' }}>${asset.purchase_price.toFixed(2)}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#2c3e50' }}>
                          {hasPrice ? (
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>${asset.currentPrice!.toFixed(2)}</div>
                              {asset.priceData && (
                                <div style={{ 
                                  fontSize: 11, 
                                  color: asset.priceData.change >= 0 ? '#22c55e' : '#ef4444',
                                  fontWeight: 'bold'
                                }}>
                                  {asset.priceData.change >= 0 ? '+' : ''}
                                  ${asset.priceData.change.toFixed(2)} ({asset.priceData.changePercent.toFixed(2)}%)
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#7f8c8d', fontSize: 12 }}>Loading...</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#2c3e50' }}>
                          {performance ? (
                            `$${performance.currentValue.toFixed(2)}`
                          ) : (
                            `$${(asset.quantity * asset.purchase_price).toFixed(2)}`
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {performance ? (
                            <div>
                              <div style={{ 
                                fontWeight: 'bold',
                                color: performance.gainLoss >= 0 ? '#22c55e' : '#ef4444'
                              }}>
                                {performance.gainLoss >= 0 ? '+' : ''}${performance.gainLoss.toFixed(2)}
                              </div>
                              <div style={{ 
                                fontSize: 11,
                                color: performance.gainLoss >= 0 ? '#22c55e' : '#ef4444',
                                fontWeight: 'bold'
                              }}>
                                ({performance.gainLossPercent >= 0 ? '+' : ''}{performance.gainLossPercent.toFixed(2)}%)
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#7f8c8d', fontSize: 12 }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {performance && asset.priceData ? (
                            <div style={{ 
                              color: performance.dayChangeValue >= 0 ? '#22c55e' : '#ef4444',
                              fontWeight: 'bold',
                              fontSize: 13
                            }}>
                              {performance.dayChangeValue >= 0 ? '+' : ''}${performance.dayChangeValue.toFixed(2)}
                            </div>
                          ) : (
                            <span style={{ color: '#7f8c8d', fontSize: 12 }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button 
                            onClick={() => handleEdit(asset)}
                            style={{ background: '#ffc107', color: '#000', border: 'none', borderRadius: 4, padding: '6px 12px', marginRight: '8px', cursor: 'pointer', fontSize: 12 }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(asset.id)}
                            style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Summary */}
        {assets.length > 0 && (
          <section style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(74,144,226,0.08)', padding: '2rem', marginTop: '2rem' }}>
            <h3 style={{ color: '#4A90E2', fontSize: 18, marginBottom: 16 }}>Portfolio Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: 8 }}>
                <p style={{ color: '#7f8c8d', margin: 0, fontSize: 14, fontWeight: '500' }}>Total Assets</p>
                <p style={{ color: '#4A90E2', margin: 0, fontSize: 24, fontWeight: 'bold' }}>{assets.length}</p>
              </div>
              
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: 8 }}>
                <p style={{ color: '#7f8c8d', margin: 0, fontSize: 14, fontWeight: '500' }}>Total Cost Basis</p>
                <p style={{ color: '#2c3e50', margin: 0, fontSize: 24, fontWeight: 'bold' }}>
                  ${assets.reduce((sum, asset) => {
                    return sum + (asset.performance?.costBasis || (asset.quantity * asset.purchase_price));
                  }, 0).toFixed(2)}
                </p>
              </div>
              
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: 8 }}>
                <p style={{ color: '#7f8c8d', margin: 0, fontSize: 14, fontWeight: '500' }}>Current Portfolio Value</p>
                <p style={{ color: '#17a2b8', margin: 0, fontSize: 24, fontWeight: 'bold' }}>
                  ${assets.reduce((sum, asset) => {
                    return sum + (asset.performance?.currentValue || (asset.quantity * asset.purchase_price));
                  }, 0).toFixed(2)}
                </p>
              </div>
              
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: 8 }}>
                <p style={{ color: '#7f8c8d', margin: 0, fontSize: 14, fontWeight: '500' }}>Total Gain/Loss</p>
                {(() => {
                  const totalGainLoss = assets.reduce((sum, asset) => {
                    return sum + (asset.performance?.gainLoss || 0);
                  }, 0);
                  const totalCost = assets.reduce((sum, asset) => {
                    return sum + (asset.performance?.costBasis || (asset.quantity * asset.purchase_price));
                  }, 0);
                  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
                  
                  return (
                    <div>
                      <p style={{ 
                        color: totalGainLoss >= 0 ? '#22c55e' : '#ef4444', 
                        margin: 0, 
                        fontSize: 24, 
                        fontWeight: 'bold' 
                      }}>
                        {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toFixed(2)}
                      </p>
                      <p style={{ 
                        color: totalGainLoss >= 0 ? '#22c55e' : '#ef4444', 
                        margin: 0, 
                        fontSize: 14, 
                        fontWeight: 'bold' 
                      }}>
                        ({totalGainLoss >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%)
                      </p>
                    </div>
                  );
                })()}
              </div>
              
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: 8 }}>
                <p style={{ color: '#7f8c8d', margin: 0, fontSize: 14, fontWeight: '500' }}>Today's Change</p>
                {(() => {
                  const todayChange = assets.reduce((sum, asset) => {
                    return sum + (asset.performance?.dayChangeValue || 0);
                  }, 0);
                  
                  return (
                    <p style={{ 
                      color: todayChange >= 0 ? '#22c55e' : '#ef4444', 
                      margin: 0, 
                      fontSize: 24, 
                      fontWeight: 'bold' 
                    }}>
                      {todayChange >= 0 ? '+' : ''}${todayChange.toFixed(2)}
                    </p>
                  );
                })()}
              </div>
            </div>
            
            {pricesLoading && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                background: '#e3f2fd', 
                borderRadius: 8, 
                textAlign: 'center',
                color: '#1976d2'
              }}>
                🔄 Updating prices and performance metrics...
              </div>
            )}
            
            {!pricesLoading && assets.some(a => !a.currentPrice) && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                background: '#fff3cd', 
                borderRadius: 8, 
                color: '#856404',
                fontSize: 14
              }}>
                ⚠️ Some asset prices could not be fetched. Performance calculations may be incomplete.
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
};

export default AssetManagementPage;
