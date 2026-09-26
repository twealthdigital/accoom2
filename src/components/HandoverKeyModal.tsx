// src/components/HandoverKeyModal.tsx
import React, { useState } from 'react';
import { Transaction } from '../types/index.ts';
import { api } from '../lib/api.ts';
import {
  X,
  Key,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Lock,
  Building,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface HandoverKeyModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onHandoverComplete: () => void;
}

export function HandoverKeyModal({
  transaction,
  isOpen,
  onClose,
  onHandoverComplete,
}: HandoverKeyModalProps) {
  if (!isOpen || !transaction) return null;

  const handoverKey =
    transaction.paymentReference || `KEY-${transaction.reference.slice(3, 9)}`;

  const [copiedKey, setCopiedKey] = useState(false);
  const [inputKey, setInputKey] = useState(handoverKey);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Inspection Checklist State
  const [checklist, setChecklist] = useState({
    water: true,
    power: true,
    keys: true,
    condition: true,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(handoverKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleVerifyHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await api.transactions.verifyKey(transaction.id, inputKey.trim());
      setSuccess(true);
      setTimeout(() => {
        onHandoverComplete();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Key verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Digital Handover Key & Access Code</h2>
              <p className="text-[11px] text-slate-400">Escrow verification code for physical move-in</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs">
          {/* Key Display Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white text-center space-y-2 border border-slate-800">
            <div className="text-[10px] uppercase font-semibold text-emerald-300 tracking-widest">
              Digital Escrow Pass Key
            </div>
            <div className="text-xl sm:text-2xl font-mono font-bold tracking-wider text-emerald-400 select-all py-1">
              {handoverKey}
            </div>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Show this code to the agent during physical inspection to confirm key handover and unlock tenant access.
            </p>
            <button
              onClick={handleCopy}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Key Copied!' : 'Copy Key'}</span>
            </button>
          </div>

          {/* Move-in Inspection Checklist */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Physical Inspection Checklist
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.water}
                  onChange={(e) => setChecklist({ ...checklist, water: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <span>Running water tested</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.power}
                  onChange={(e) => setChecklist({ ...checklist, power: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <span>Pre-paid meter active</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.keys}
                  onChange={(e) => setChecklist({ ...checklist, keys: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <span>Room key locks tested</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.condition}
                  onChange={(e) => setChecklist({ ...checklist, condition: e.target.checked })}
                  className="rounded text-emerald-600"
                />
                <span>Condition matches listing</span>
              </label>
            </div>
          </div>

          {/* Key Verification Simulator */}
          <form onSubmit={handleVerifyHandover} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="font-semibold text-slate-800">
              Verify Key & Release Escrow Payout
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Either the tenant or host agent can verify this key below to simulate physical handover completion.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Enter handover key code..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Verify Key</span>
              </button>
            </div>

            {error && (
              <div className="text-rose-700 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </div>
            )}

            {success && (
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-900 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Handover verified! Tenancy activated and escrow funds released to agent.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
