// src/components/BookingModal.tsx
import React, { useState } from 'react';
import { Property } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../lib/api.ts';
import {
  X,
  Lock,
  CreditCard,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building,
} from 'lucide-react';

interface BookingModalProps {
  property: Property | null;
  onClose: () => void;
  onSuccess: (transaction: any) => void;
  onOpenWallet: () => void;
}

export function BookingModal({ property, onClose, onSuccess, onOpenWallet }: BookingModalProps) {
  if (!property) return null;

  const { currentUser, refreshProfile } = useAuth();
  const [rentDuration, setRentDuration] = useState('1 year');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rentAmount = property.price;
  const platformFee = Math.round(rentAmount * 0.05); // 5% escrow protection fee
  const totalAmount = rentAmount + platformFee;

  const userBalance = currentUser?.wallet?.balance || 0;
  const hasEnoughBalance = userBalance >= totalAmount;

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (paymentMethod === 'wallet' && !hasEnoughBalance) {
      setError(`Insufficient wallet balance. You have ₦${userBalance.toLocaleString()}, but need ₦${totalAmount.toLocaleString()}. Please top up your wallet.`);
      return;
    }

    try {
      setLoading(true);
      const res = await api.transactions.create({
        propertyId: property.id,
        rentDuration,
        paymentMethod,
      });

      await refreshProfile();
      onSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Failed to process escrow booking');
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
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">ACCOOM Escrow Checkout</h2>
              <p className="text-[11px] text-slate-400">Guaranteed Key Handover Protection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmBooking} className="p-6 space-y-5">
          {/* Property Summary Pill */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <img
              src={property.images[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=300&q=80'}
              alt={property.title}
              className="w-14 h-14 rounded-xl object-cover"
            />
            <div className="truncate">
              <h4 className="text-xs font-bold text-slate-900 truncate">{property.title}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {property.locationCity}, {property.locationState} · {property.propertyType}
              </p>
              <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                ₦{property.price.toLocaleString()} / {property.pricingPeriod}
              </p>
            </div>
          </div>

          {/* Lease Duration Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Lease Duration
            </label>
            <select
              value={rentDuration}
              onChange={(e) => setRentDuration(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="1 year">1 Academic Session / Year (Full Term)</option>
              <option value="1 semester">1 Semester (Short Let Extension)</option>
              <option value="2 years">2 Years (Multi-Year Tenancy)</option>
            </select>
          </div>

          {/* Transparent Cost Breakdown */}
          <div className="rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Rental Charge</span>
              <span className="font-mono font-medium text-slate-900">₦{rentAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1">
                Platform Escrow Protection (5%)
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </span>
              <span className="font-mono font-medium text-slate-900">₦{platformFee.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-bold text-slate-900">
              <span>Total Escrow Deposit</span>
              <span className="text-emerald-700 font-mono">₦{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Select Payment Source
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('wallet')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  paymentMethod === 'wallet'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  {paymentMethod === 'wallet' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold">ACCOOM Wallet</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Avail: ₦{userBalance.toLocaleString()}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  paymentMethod === 'card'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  {paymentMethod === 'card' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold">Debit Card / Transfer</div>
                  <div className="text-[10px] text-emerald-700 font-medium">Dummy Test Keys Active</div>
                </div>
              </button>
            </div>
          </div>

          {/* Dummy Card & Test Keys Sandbox UI */}
          {paymentMethod === 'card' && (
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Sandbox Card Checkout
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                  Dummy Keys Enabled
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>API Key: pk_test_accoom_sandbox</span>
                  <span className="text-emerald-600 font-bold">TEST MODE</span>
                </div>
                <div className="font-mono text-xs font-bold tracking-wider text-slate-800">
                  4242 •••• •••• 4242
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>EXP: 12/28</span>
                  <span>CVC: 123</span>
                  <span>VERVE / VISA</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-snug">
                Test keys are preloaded. Clicking Deposit will process the transaction through our simulated escrow pipeline.
              </p>
            </div>
          )}

          {/* Insufficient balance prompt with quick top-up shortcut */}
          {paymentMethod === 'wallet' && !hasEnoughBalance && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
              <div>
                Wallet short by ₦{(totalAmount - userBalance).toLocaleString()}.
              </div>
              <button
                type="button"
                onClick={onOpenWallet}
                className="font-bold underline text-amber-950"
              >
                Fund Wallet
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Escrow Guarantee Disclaimer */}
          <div className="text-[11px] text-slate-400 leading-relaxed text-center">
            By clicking Deposit & Reserve, you agree to ACCOOM Escrow Terms. Funds will remain safely held until you confirm receipt of keys and satisfactory premises.
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Securing in Escrow...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Deposit ₦{totalAmount.toLocaleString()} into Escrow</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
