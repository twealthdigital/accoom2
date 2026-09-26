// src/components/WalletModal.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../lib/api.ts';
import { WalletLedgerItem } from '../types/index.ts';
import {
  X,
  Wallet,
  Eye,
  EyeOff,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Plus,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  if (!isOpen) return null;

  const { currentUser, balanceVisible, toggleBalanceVisible, refreshProfile } = useAuth();
  const [ledger, setLedger] = useState<WalletLedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('100000');
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const res = await api.wallet.get();
      if (res && res.ledger) {
        setLedger(res.ledger);
      }
    } catch (err) {
      console.error('Failed to load wallet ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [isOpen]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(depositAmount, 10);
    if (isNaN(amt) || amt <= 0) return;

    try {
      setIsDepositing(true);
      await api.wallet.deposit(amt);
      await refreshProfile();
      await fetchWalletData();
      setDepositSuccess(true);
      setTimeout(() => setDepositSuccess(false), 3000);
    } catch (err) {
      console.error('Deposit error:', err);
    } finally {
      setIsDepositing(false);
    }
  };

  const balance = currentUser?.wallet?.balance || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">ACCOOM Wallet & Ledger</h2>
              <p className="text-[11px] text-slate-400">Escrow funds & rent balance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Main Balance Card */}
          <div className="relative rounded-2xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 text-white p-6 overflow-hidden shadow-lg border border-emerald-800">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 rounded-full bg-emerald-500/10 pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-medium text-emerald-300 tracking-wider">
                Available Wallet Balance
              </span>
              <button
                onClick={toggleBalanceVisible}
                className="flex items-center gap-1 text-xs text-emerald-300 hover:text-white transition bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur"
              >
                {balanceVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{balanceVisible ? 'Hide' : 'Show'}</span>
              </button>
            </div>

            <div className="text-3xl sm:text-4xl font-bold tracking-tight font-sans">
              {balanceVisible ? `₦${balance.toLocaleString()}` : '••••••••••••'}
            </div>

            <div className="mt-4 pt-4 border-t border-emerald-800/80 flex items-center justify-between text-xs text-emerald-200">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Escrow Guarantee Protected</span>
              </div>
              <span className="font-mono text-[11px] opacity-80">Wallet ID: #{currentUser?.wallet?.id || '001'}</span>
            </div>
          </div>

          {/* Quick Deposit Form */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Top Up ACCOOM Balance (Instant Demo Funding)
            </div>

            <div className="flex flex-wrap gap-2">
              {[50000, 100000, 200000, 500000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDepositAmount(String(amt))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    depositAmount === String(amt)
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  +₦{amt.toLocaleString()}
                </button>
              ))}
            </div>

            <form onSubmit={handleDeposit} className="flex gap-2 pt-1">
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="1000"
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                placeholder="Custom Amount (₦)"
              />
              <button
                type="submit"
                disabled={isDepositing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1 shadow-sm shadow-emerald-600/20 disabled:opacity-50"
              >
                {isDepositing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Deposit Funds
              </button>
            </form>

            {depositSuccess && (
              <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Deposit processed! Your wallet balance has been updated.
              </div>
            )}
          </div>

          {/* Immutable Ledger Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                Transaction Ledger History
              </h3>
              <button
                onClick={fetchWalletData}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="text-center py-6 text-slate-400 text-xs">Loading ledger records...</div>
            ) : ledger.length === 0 ? (
              <div className="text-center py-8 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                No financial movement yet. Deposit funds above to start.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
                {ledger.map((item) => {
                  const isPositive = item.amount > 0;
                  return (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {item.description || item.type}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Ref: {item.reference} · {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`font-semibold font-mono ${
                          isPositive ? 'text-emerald-700' : 'text-slate-800'
                        }`}
                      >
                        {isPositive ? '+' : ''}₦{Math.abs(item.amount).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
