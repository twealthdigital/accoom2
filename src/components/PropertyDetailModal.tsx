// src/components/PropertyDetailModal.tsx
import React, { useState } from 'react';
import { Property, Review } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  X,
  MapPin,
  Bed,
  Bath,
  ShieldCheck,
  Heart,
  Star,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Share2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';

interface PropertyDetailModalProps {
  property: Property | null;
  onClose: () => void;
  onBook: (property: Property) => void;
  onMessageAgent: (property: Property) => void;
  onToggleSave: (propertyId: number) => void;
  isSaved?: boolean;
}

export function PropertyDetailModal({
  property,
  onClose,
  onBook,
  onMessageAgent,
  onToggleSave,
  isSaved = false,
}: PropertyDetailModalProps) {
  if (!property) return null;

  const { currentUser } = useAuth();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  const images = property.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason) return;
    setReportSuccess(true);
    setTimeout(() => {
      setReportOpen(false);
      setReportSuccess(false);
      setReportReason('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
              {property.propertyType}
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Ref: ACC-{property.id.toString().padStart(4, '0')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="Share Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onToggleSave(property.id)}
              className={`p-2 rounded-xl transition ${
                isSaved ? 'text-rose-500 bg-rose-50' : 'text-slate-500 hover:text-rose-500 hover:bg-slate-100'
              }`}
              title="Save to favorites"
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-6 space-y-8 flex-1">
          {/* Gallery Section */}
          <div className="space-y-3">
            <div className="relative aspect-16/9 sm:aspect-21/9 rounded-2xl overflow-hidden bg-slate-900 group">
              <img
                src={images[activeImageIndex]}
                alt={property.title}
                className="w-full h-full object-cover"
              />

              {/* Prev / Next controls */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Photo counter */}
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur text-white text-[11px] font-mono px-2.5 py-1 rounded-full">
                {activeImageIndex + 1} / {images.length} Photos
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition ${
                      activeImageIndex === idx ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Price Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {property.locationArea ? `${property.locationArea}, ` : ''}
                  {property.locationCity}, {property.locationState}
                </span>
                {property.address && (
                  <>
                    <span>·</span>
                    <span className="text-slate-400">{property.address}</span>
                  </>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 leading-tight">
                {property.title}
              </h1>

              {/* Quick specs */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600 font-medium">
                <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <Bed className="w-3.5 h-3.5 text-emerald-600" />
                  {property.bedrooms} {property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <Bath className="w-3.5 h-3.5 text-emerald-600" />
                  {property.bathrooms} {property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
                </span>
                {property.furnished && (
                  <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold">
                    Furnished
                  </span>
                )}
                {property.verified && (
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    Physical Inspection Verified
                  </span>
                )}
              </div>
            </div>

            {/* Price Box */}
            <div className="sm:text-right shrink-0 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Annual Rental Fee
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">
                ₦{property.price.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">
                Protected via ACCOOM Escrow
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
              About This Accommodation
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Amenities Grid */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Verified Amenities & Utilities
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {property.amenities.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules & Requirements */}
          {property.rules && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900 space-y-1">
              <div className="font-semibold uppercase tracking-wider text-[11px] text-amber-800">
                Lodge Guidelines & Rules
              </div>
              <p className="leading-relaxed">{property.rules}</p>
            </div>
          )}

          {/* Agent Information Card */}
          <div className="rounded-2xl border border-slate-200 p-5 bg-gradient-to-br from-slate-50 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-600/20">
                {property.agent?.businessName ? property.agent.businessName[0] : 'A'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    {property.agent?.businessName || 'Accredited Specialist'}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    {property.agent?.tier || 'Pro'} Agent
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {property.agent?.location || 'Akungba Akoko, Ondo State'}
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1 text-slate-700">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <strong>{property.agent?.rating || '4.9'}</strong> ({property.agent?.reviewCount || 24} reviews)
                  </span>
                  <span>·</span>
                  <span>{property.agent?.completedTransactions || 40}+ keys handed over</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onMessageAgent(property)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Message Agent
              </button>
            </div>
          </div>

          {/* Trust & Escrow Guarantee Card */}
          <div className="p-4 rounded-2xl bg-emerald-950 text-emerald-100 flex items-start gap-3 border border-emerald-900">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-semibold text-white">ACCOOM Escrow Protection Active</div>
              <p className="text-emerald-200/90 leading-relaxed">
                When you book through ACCOOM, your funds are never paid directly to anyone upfront. They are held safely in trust until you physically inspect the premises, verify electricity and water fixtures, and successfully receive keys.
              </p>
            </div>
          </div>

          {/* Report Listing trigger */}
          <div className="pt-2 text-right">
            <button
              onClick={() => setReportOpen(true)}
              className="text-xs text-slate-400 hover:text-rose-600 transition flex items-center gap-1 ml-auto"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Report listing or suspicious agent
            </button>
          </div>

          {/* Report Form Dialog */}
          {reportOpen && (
            <form onSubmit={handleReportSubmit} className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-3 text-xs">
              <div className="font-semibold text-rose-900">Submit Listing Concern to Compliance Team</div>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                required
                className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-slate-800"
              >
                <option value="">Select reason for report...</option>
                <option value="Inaccurate photos or false description">Inaccurate photos or false description</option>
                <option value="Accommodation already rented / unavailable">Accommodation already rented / unavailable</option>
                <option value="Agent asked for direct unescrowed transfer">Agent asked for direct unescrowed transfer</option>
                <option value="Incorrect price specified">Incorrect price specified</option>
              </select>
              {reportSuccess ? (
                <div className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Report submitted to admin for immediate review.
                </div>
              ) : (
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700"
                  >
                    Submit Report
                  </button>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Modal Sticky Bottom CTA Bar */}
        <div className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-400">Total Escrow Deposit</div>
            <div className="text-xl font-bold text-slate-900">
              ₦{property.price.toLocaleString()}
              <span className="text-xs font-normal text-slate-500 ml-1">/ year</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onMessageAgent(property)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              Inquire
            </button>
            <button
              onClick={() => onBook(property)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Reserve with Escrow</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
