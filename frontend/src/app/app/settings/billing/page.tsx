'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  CreditCard, Check, ShieldCheck, AlertCircle, RefreshCw, Sparkles, CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';

function BillingSettingsContent() {
  const searchParams = useSearchParams();
  const testPayRef = searchParams.get('test_pay_ref');

  const [sub, setSub] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState('');
  const [error, setError] = useState('');

  const loadBillingData = async () => {
    try {
      const [subData, plansData] = await Promise.all([
        api.getSubscription(),
        api.getPlans(),
      ]);
      setSub(subData);
      setPlans(plansData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load billing information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  // Handle Paystack Test Mode verification callback
  useEffect(() => {
    async function handleAutoVerify() {
      if (testPayRef) {
        setUpgrading(true);
        try {
          const res = await api.verifyPayment(testPayRef);
          setVerifyMsg(`Payment verified! You are now subscribed to ${res.plan_name}.`);
          await loadBillingData();
        } catch (err: any) {
          setError(err.message || 'Failed to verify payment reference.');
        } finally {
          setUpgrading(false);
        }
      }
    }
    handleAutoVerify();
  }, [testPayRef]);

  const handleUpgrade = async (planId: string) => {
    setError('');
    setUpgrading(true);

    try {
      const res = await api.initializePayment({
        plan_id: planId,
        callback_url: window.location.href.split('?')[0]
      });

      if (res.data?.authorization_url) {
        // In live mode or test mode, navigate to authorization url
        window.location.href = res.data.authorization_url;
      } else if (res.free) {
        setVerifyMsg('Switched to Free plan.');
        await loadBillingData();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Paystack checkout.');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <RefreshCw className="w-8 h-8 text-forest-700 animate-spin" />
        <p className="text-sm text-gray-500">Loading subscription details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <CreditCard className="w-6 h-6 text-forest-700" />
          <span>Subscription & Billing</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Secure payment integration powered by Paystack. Manage plan tiers and entitlements.
        </p>
      </div>

      {verifyMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm flex items-start space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <span>{verifyMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Current Active Plan Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Plan</span>
          <div className="text-xl font-extrabold text-forest-900 mt-0.5">
            {sub?.plan_name || 'Free Explore'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Status: <span className="font-semibold text-emerald-700 capitalize">{sub?.status || 'Active'}</span> • {sub?.price_formatted || '₦0.00/month'}
          </div>
        </div>

        <div className="bg-forest-50 border border-forest-200 px-4 py-2.5 rounded-xl text-xs space-y-1">
          <div className="font-bold text-forest-900">Entitlements:</div>
          <div className="text-forest-800">
            • Up to {sub?.feature_limits?.max_farms || 1} registered farms
          </div>
          <div className="text-forest-800">
            • {sub?.feature_limits?.max_assessments_per_month || 3} assessments/month
          </div>
        </div>
      </div>

      {/* Available Plans Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Available Subscription Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = sub?.plan_code === p.code;
            return (
              <div
                key={p.id}
                className={`bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between space-y-4 ${
                  isCurrent ? 'border-forest-600 ring-2 ring-forest-600/20' : 'border-gray-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-base text-gray-900">{p.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-bold bg-forest-600 text-white px-2 py-0.5 rounded-full uppercase">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{p.description}</p>
                  <div className="text-2xl font-extrabold text-gray-950">
                    {p.price_formatted}
                    <span className="text-xs font-normal text-gray-500">/{p.billing_interval}</span>
                  </div>

                  <ul className="text-xs text-gray-600 space-y-2 pt-3 border-t border-gray-100">
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{p.feature_limits.max_farms} registered farms</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{p.feature_limits.max_assessments_per_month} assessments / month</span>
                    </li>
                    {p.feature_limits.export_pdf_reports && (
                      <li className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Downloadable PDF farm reports</span>
                      </li>
                    )}
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgrade(p.id)}
                  disabled={isCurrent || upgrading}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 ${
                    isCurrent
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-forest-900 hover:bg-forest-950 text-white shadow-sm'
                  }`}
                >
                  <span>{isCurrent ? 'Current Plan' : (p.price_minor_units === 0 ? 'Downgrade to Free' : 'Upgrade via Paystack')}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BillingSettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 text-xs text-gray-500">
        Loading billing settings...
      </div>
    }>
      <BillingSettingsContent />
    </Suspense>
  );
}
