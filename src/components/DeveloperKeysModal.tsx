// src/components/DeveloperKeysModal.tsx
import React, { useEffect, useState } from 'react';
import { api } from '../lib/api.ts';
import {
  X,
  Key,
  Copy,
  Check,
  CreditCard,
  ShieldCheck,
  Code2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface DeveloperKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeveloperKeysModal({ isOpen, onClose }: DeveloperKeysModalProps) {
  if (!isOpen) return null;

  const [keysData, setKeysData] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchKeys() {
      try {
        setLoading(true);
        const data = await api.keys.get();
        setKeysData(data);
      } catch (err) {
        console.error('Failed to load dummy keys:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchKeys();
  }, [isOpen]);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Developer & Sandbox Dummy Keys</h2>
              <p className="text-[11px] text-slate-400">Pre-configured test keys for payment & escrow testing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* Active Sandbox Mode Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Sandbox Test Environment Active</span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                These dummy keys are functional for checkout simulations, webhook verification, and digital handover pass validation.
              </p>
            </div>
          </div>

          {/* API Keys List */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-emerald-600" />
              API Test Keys
            </h3>

            {[
              {
                id: 'pub',
                label: 'Public Client API Key',
                val: keysData?.publicKey || 'pk_test_accoom_live_sandbox_7a9f82d1',
                desc: 'Used for frontend checkout initialization',
              },
              {
                id: 'sec',
                label: 'Secret Server API Key',
                val: keysData?.secretKey || 'sk_test_accoom_vault_4c82e091b5aa',
                desc: 'Used for server-authoritative balance and escrow charges',
              },
              {
                id: 'esc',
                label: 'Master Escrow Key',
                val: keysData?.escrowKey || 'esc_master_akungba_aaua_key_2026',
                desc: 'Universal master key to unlock any handover in sandbox test',
              },
              {
                id: 'wh',
                label: 'Webhook Signing Secret',
                val: keysData?.webhookSecret || 'whsec_test_accoom_secure_signature_9918',
                desc: 'Verifies Stripe/Paystack event signatures',
              },
            ].map((k) => (
              <div key={k.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{k.label}</span>
                  <button
                    onClick={() => copyToClipboard(k.val, k.id)}
                    className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    {copiedField === k.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Key</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 select-all truncate">
                  {k.val}
                </div>
                <p className="text-[10px] text-slate-400">{k.desc}</p>
              </div>
            ))}
          </div>

          {/* Test Cards for Sandbox Checkout */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              Pre-configured Sandbox Test Cards
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { brand: 'Verve / Visa (Nigeria & Global)', number: '4242 4242 4242 4242', exp: '12/28', cvc: '123' },
                { brand: 'Mastercard Corporate', number: '5555 5555 5555 4444', exp: '11/27', cvc: '888' },
              ].map((card, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                    <span>{card.brand}</span>
                    <span className="text-emerald-400 font-bold">APPROVED</span>
                  </div>
                  <div className="font-mono font-bold tracking-wider text-xs">{card.number}</div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>EXP: {card.exp}</span>
                    <span>CVC: {card.cvc}</span>
                    <button
                      onClick={() => copyToClipboard(card.number, `card-${i}`)}
                      className="text-white hover:text-emerald-300 font-sans font-bold"
                    >
                      {copiedField === `card-${i}` ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
