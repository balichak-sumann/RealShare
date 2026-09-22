"use client";
import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { getAuthHeader } from "@/lib/api-auth";

export default function SubscriptionPlansPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'coupons'>('plans');

  // Plans State
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);

  // Coupons State
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '', discount_type: 'percentage', discount_value: '', min_plan_price: '0',
    applicable_role: '', applicable_tier: '', max_uses: '1', valid_from: '', valid_until: ''
  });
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchPlans();
    if (activeTab === 'coupons') fetchCoupons();
  }, [activeTab]);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // --- PLANS LOGIC ---
  const fetchPlans = async () => {
    setLoadingPlans(true);
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    try {
      const res = await fetch('/api/plans/admin', { headers: authHeader });
      if (res.ok) setPlans(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handlePlanChange = (planId: string, field: string, value: any) => {
    setPlans(plans.map(p => p.id === planId ? { ...p, [field]: value } : p));
  };

  const savePlan = async (plan: any) => {
    setSavingPlanId(plan.id);
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    try {
      const res = await fetch('/api/plans/admin', {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: plan.id,
          price: Number(plan.price),
          postings_limit: Number(plan.postings_limit),
          validity_days: Number(plan.validity_days),
          post_listing_days: Number(plan.post_listing_days),
          support_level: plan.support_level,
          post_assistance: plan.post_assistance,
          referral_program: plan.referral_program,
          renewal: plan.renewal,
          is_active: plan.is_active,
          tagline: plan.tagline
        }),
      });
      if (res.ok) showMessage('Plan saved successfully!');
      else showMessage('Failed to save plan', 'error');
    } catch (e) {
      showMessage('Error saving plan', 'error');
    } finally {
      setSavingPlanId(null);
    }
  };

  // --- COUPONS LOGIC ---
  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    try {
      const res = await fetch('/api/plans/admin/coupons', { headers: authHeader });
      if (res.ok) setCoupons(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const initiateCouponCreation = async () => {
    if (!couponForm.code || !couponForm.discount_value || !couponForm.valid_from || !couponForm.valid_until) {
      showMessage('Please fill all required fields', 'error');
      return;
    }
    setCreatingCoupon(true);
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    try {
      const res = await fetch('/api/plans/admin/coupons', {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-otp' }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpStep(true);
        showMessage('OTP sent to your email', 'success');
      } else {
        showMessage(data.error || 'Failed to send OTP', 'error');
      }
    } catch (e) {
      showMessage('Error sending OTP', 'error');
    } finally {
      setCreatingCoupon(false);
    }
  };

  const submitCoupon = async () => {
    if (!otp) return showMessage('Please enter OTP', 'error');
    setCreatingCoupon(true);
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    try {
      const res = await fetch('/api/plans/admin/coupons', {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          otp,
          ...couponForm,
          applicable_role: couponForm.applicable_role || null,
          applicable_tier: couponForm.applicable_tier || null,
          max_uses: Number(couponForm.max_uses),
          min_plan_price: Number(couponForm.min_plan_price),
          discount_value: Number(couponForm.discount_value),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCouponModal(false);
        setOtpStep(false);
        setOtp('');
        fetchCoupons();
        showMessage('Coupon created successfully!');
      } else {
        showMessage(data.error || 'Failed to create coupon', 'error');
      }
    } catch (e) {
      showMessage('Error creating coupon', 'error');
    } finally {
      setCreatingCoupon(false);
    }
  };

  const toggleCouponStatus = async (id: string, currentStatus: boolean) => {
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    try {
      const res = await fetch('/api/plans/admin/coupons', {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentStatus }),
      });
      if (res.ok) fetchCoupons();
    } catch (e) {
      showMessage('Error toggling coupon', 'error');
    }
  };


  return (
    <AdminLayout title="Subscription Plans">
      {message && (
        <div style={{ background: message.type === 'success' ? '#16A34A' : '#DC2626', color: '#fff', padding: '12px 20px', borderRadius: 8, marginBottom: 20, fontWeight: 600 }}>
          {message.text}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 24, borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => setActiveTab('plans')} style={{ background: 'none', border: 'none', padding: '12px 20px', cursor: 'pointer', fontSize: '1rem', fontWeight: activeTab === 'plans' ? 700 : 500, color: activeTab === 'plans' ? '#2563EB' : 'var(--text-secondary)', borderBottom: activeTab === 'plans' ? '3px solid #2563EB' : '3px solid transparent' }}>
          Plans Management
        </button>
        <button onClick={() => setActiveTab('coupons')} style={{ background: 'none', border: 'none', padding: '12px 20px', cursor: 'pointer', fontSize: '1rem', fontWeight: activeTab === 'coupons' ? 700 : 500, color: activeTab === 'coupons' ? '#2563EB' : 'var(--text-secondary)', borderBottom: activeTab === 'coupons' ? '3px solid #2563EB' : '3px solid transparent' }}>
          Discount Coupons
        </button>
      </div>

      {activeTab === 'plans' && (
        <div>
          {loadingPlans ? <p style={{ color: 'var(--text-secondary)' }}>Loading plans...</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
              {plans.map(plan => (
                <div key={plan.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 24, opacity: plan.is_active ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <span style={{ background: plan.role_type === 'agent' ? '#DBEAFE' : '#FEF3C7', color: plan.role_type === 'agent' ? '#1E40AF' : '#92400E', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{plan.role_type}</span>
                      <h3 style={{ margin: '8px 0 0 0', color: 'var(--text-primary)' }}>{plan.tier}</h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>Active Users</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{plan._count?.subscriptions || 0}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Price (₹)</label>
                      <input type="number" value={plan.price} onChange={(e) => handlePlanChange(plan.id, 'price', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Postings</label>
                        <input type="number" value={plan.postings_limit} onChange={(e) => handlePlanChange(plan.id, 'postings_limit', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Validity (Days)</label>
                        <input type="number" value={plan.validity_days} onChange={(e) => handlePlanChange(plan.id, 'validity_days', e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }} />
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Is Active</label>
                      <input type="checkbox" checked={plan.is_active} onChange={(e) => handlePlanChange(plan.id, 'is_active', e.target.checked)} style={{ width: 18, height: 18 }} />
                    </div>

                    <button onClick={() => savePlan(plan)} disabled={savingPlanId === plan.id} style={{ marginTop: 16, width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 600, cursor: savingPlanId === plan.id ? 'not-allowed' : 'pointer' }}>
                      {savingPlanId === plan.id ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'coupons' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Active Coupons</h3>
            <button onClick={() => setShowCouponModal(true)} style={{ background: '#10B981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>+ Create Coupon</button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-secondary)', borderRadius: 12, overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', textAlign: 'left' }}>
                <th style={{ padding: 16, color: 'var(--text-secondary)', fontWeight: 600 }}>Code</th>
                <th style={{ padding: 16, color: 'var(--text-secondary)', fontWeight: 600 }}>Discount</th>
                <th style={{ padding: 16, color: 'var(--text-secondary)', fontWeight: 600 }}>Role/Tier</th>
                <th style={{ padding: 16, color: 'var(--text-secondary)', fontWeight: 600 }}>Uses</th>
                <th style={{ padding: 16, color: 'var(--text-secondary)', fontWeight: 600 }}>Validity</th>
                <th style={{ padding: 16, color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid var(--border-color)', opacity: c.is_active ? 1 : 0.5 }}>
                  <td style={{ padding: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{c.code}</td>
                  <td style={{ padding: 16, color: 'var(--text-primary)' }}>{c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}</td>
                  <td style={{ padding: 16, color: 'var(--text-primary)' }}>{c.applicable_role || 'All'} / {c.applicable_tier || 'All'}</td>
                  <td style={{ padding: 16, color: 'var(--text-primary)' }}>{c.times_used} / {c.max_uses}</td>
                  <td style={{ padding: 16, color: 'var(--text-primary)' }}>{new Date(c.valid_from).toLocaleDateString()} - {new Date(c.valid_until).toLocaleDateString()}</td>
                  <td style={{ padding: 16 }}>
                    <button onClick={() => toggleCouponStatus(c.id, c.is_active)} style={{ background: c.is_active ? '#DC2626' : '#10B981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}>
                      {c.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* COUPON MODAL */}
      {showCouponModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-secondary)', padding: 32, borderRadius: 16, width: '100%', maxWidth: 500, border: '1px solid var(--border-color)' }}>
            <h2 style={{ color: 'var(--text-primary)', marginTop: 0 }}>Create Discount Coupon</h2>
            
            {!otpStep ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Coupon Code *</label>
                  <input type="text" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} placeholder="e.g. FESTIVAL50" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', marginTop: 4, textTransform: 'uppercase' }} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Discount Type *</label>
                    <select value={couponForm.discount_type} onChange={e => setCouponForm({...couponForm, discount_type: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', marginTop: 4 }}>
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Discount Value *</label>
                    <input type="number" value={couponForm.discount_value} onChange={e => setCouponForm({...couponForm, discount_value: e.target.value})} placeholder="e.g. 50" style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', marginTop: 4 }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Valid From *</label>
                    <input type="date" value={couponForm.valid_from} onChange={e => setCouponForm({...couponForm, valid_from: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Valid Until *</label>
                    <input type="date" value={couponForm.valid_until} onChange={e => setCouponForm({...couponForm, valid_until: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', marginTop: 4 }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Max Uses</label>
                  <input type="number" value={couponForm.max_uses} onChange={e => setCouponForm({...couponForm, max_uses: e.target.value})} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', marginTop: 4 }} />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <button onClick={() => setShowCouponModal(false)} style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={initiateCouponCreation} disabled={creatingCoupon} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#10B981', color: '#fff', fontWeight: 600, cursor: creatingCoupon ? 'not-allowed' : 'pointer' }}>
                    {creatingCoupon ? 'Sending OTP...' : 'Next (Verify OTP)'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Enter the OTP sent to your admin email to confirm coupon creation.</p>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6} style={{ width: 150, textAlign: 'center', fontSize: '1.5rem', letterSpacing: 8, padding: 12, borderRadius: 8, border: '2px solid #2563EB', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', marginBottom: 24 }} />
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setOtpStep(false)} style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>Back</button>
                  <button onClick={submitCoupon} disabled={creatingCoupon || otp.length !== 6} style={{ flex: 1, padding: 12, borderRadius: 8, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 600, cursor: creatingCoupon || otp.length !== 6 ? 'not-allowed' : 'pointer' }}>
                    {creatingCoupon ? 'Verifying...' : 'Create Coupon'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
