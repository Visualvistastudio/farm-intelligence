'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, RefreshCw, AlertCircle, RotateCcw, Check, DollarSign } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refundModal, setRefundModal] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('Customer requested refund');
  const [refundLoading, setRefundLoading] = useState(false);

  const loadPayments = async () => {
    try {
      const data = await api.getPayments();
      setPayments(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModal) return;
    setRefundLoading(true);

    try {
      await api.processRefund(refundModal.id, refundReason);
      setRefundModal(null);
      await loadPayments();
    } catch (err: any) {
      alert(err.message || 'Failed to process refund.');
    } finally {
      setRefundLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Financial Transactions & Settlements</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track Paystack collections, provider transaction references, fees, and customer refunds.
          </p>
        </div>

        <button
          onClick={loadPayments}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center space-x-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-950/80 border border-red-500 text-red-200 p-4 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Transaction Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-850 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Reference / User</th>
              <th className="px-5 py-3.5">Gateway Provider</th>
              <th className="px-5 py-3.5">Amount (NGN)</th>
              <th className="px-5 py-3.5">Fee (NGN)</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Date Verified</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-850/60 transition">
                <td className="px-5 py-3.5">
                  <div className="font-mono text-white font-semibold">{p.provider_reference}</div>
                  <div className="text-slate-400 text-[11px]">{p.user_email}</div>
                </td>
                <td className="px-5 py-3.5 uppercase font-semibold text-slate-300">{p.provider}</td>
                <td className="px-5 py-3.5 font-bold text-emerald-400">
                  ₦{p.amount_ngn.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-3.5 text-slate-400">
                  ₦{p.fee_ngn.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    p.status === 'successful'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : (p.status === 'refunded' ? 'bg-purple-950 text-purple-400 border border-purple-800' : 'bg-slate-800 text-slate-400')
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                  {p.verified_at ? new Date(p.verified_at).toLocaleString() : 'Pending'}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {p.status === 'successful' && (
                    <button
                      onClick={() => setRefundModal(p)}
                      className="text-red-400 hover:text-red-300 text-xs font-semibold px-2.5 py-1 rounded hover:bg-red-950/50 transition flex items-center space-x-1 ml-auto"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Refund</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-slate-500">
                  No payment records found. Test transactions will appear here upon checkout.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Refund Modal */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <RotateCcw className="w-5 h-5 text-red-400" />
              <span>Authorize Customer Refund</span>
            </h3>
            <p className="text-xs text-slate-400">
              Refunding transaction <strong className="text-white font-mono">{refundModal.provider_reference}</strong> for amount <strong>₦{refundModal.amount_ngn}</strong>.
            </p>

            <form onSubmit={handleRefundSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase">Refund Reason</label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundModal(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold"
                >
                  {refundLoading ? 'Processing...' : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
