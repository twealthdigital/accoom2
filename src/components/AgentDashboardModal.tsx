// src/components/AgentDashboardModal.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../lib/api.ts';
import {
  X,
  Building,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Star,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

interface AgentDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropertyCreated: () => void;
}

export function AgentDashboardModal({ isOpen, onClose, onPropertyCreated }: AgentDashboardModalProps) {
  if (!isOpen) return null;

  const { currentUser, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'overview'>('create');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('Self-Contained');
  const [locationCity, setLocationCity] = useState('Akungba');
  const [locationState, setLocationState] = useState('Ondo State');
  const [locationArea, setLocationArea] = useState('Permanent Site Gate');
  const [address, setAddress] = useState('');
  const [price, setPrice] = useState('180000');
  const [pricingPeriod, setPricingPeriod] = useState('year');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [furnished, setFurnished] = useState(false);
  const [rules, setRules] = useState('Quiet hours after 10 PM. Pre-paid electric meter installed.');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    'Running Borehole Water',
    'Pre-paid Meter',
    'Security Fence',
  ]);
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
  );

  const availableAmenities = [
    'Running Borehole Water',
    'Pre-paid Meter',
    'Security Fence',
    'Night Watchman',
    'Private Balcony',
    'Standby Generator',
    'Tiled Floors',
    'Fibre Internet',
    'Car Parking Space',
    'Air Conditioning',
  ];

  const toggleAmenity = (item: string) => {
    if (selectedAmenities.includes(item)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== item));
    } else {
      setSelectedAmenities([...selectedAmenities, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title || !description || !price) {
      setError('Please provide title, description and price');
      return;
    }

    try {
      setLoading(true);
      await api.properties.create({
        title,
        description,
        propertyType,
        locationCity,
        locationState,
        locationArea,
        address,
        price: Number(price),
        pricingPeriod,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        furnished,
        amenities: selectedAmenities,
        images: [
          imageUrl,
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
        ],
        rules,
      });

      await refreshProfile();
      setSuccess(true);
      onPropertyCreated();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to publish listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Host & Agent Partner Portal</h2>
              <p className="text-[11px] text-slate-400">List verified student lodges and residential apartments</p>
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
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
          {/* Partner Tier Overview Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-slate-50 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {currentUser?.agentProfile?.businessName || 'Accredited Housing Partner'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                  {currentUser?.agentProfile?.tier || 'Pro'} Partner
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Zero double-allocation policy active · All rents guaranteed through ACCOOM Escrow
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
              <div>
                <span className="text-slate-400 text-[10px] block">Rating</span>
                <span className="font-bold flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {currentUser?.agentProfile?.rating || '4.9'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Completed</span>
                <span className="font-bold text-emerald-700">
                  {currentUser?.agentProfile?.completedTransactions || 62} Bookings
                </span>
              </div>
            </div>
          </div>

          {/* Listing Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              Publish New Property Listing
            </h3>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Property published and live on ACCOOM Marketplace!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Property Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern Self-Contain Lodge near AAUA Permanent Site Gate"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Self-Contained">Self-Contained</option>
                  <option value="1 Bedroom Flat">1 Bedroom Flat</option>
                  <option value="2 Bedroom Flat">2 Bedroom Flat</option>
                  <option value="Room & Parlour">Room & Parlour</option>
                  <option value="Student Lodge">Student Lodge</option>
                  <option value="Studio">Studio</option>
                  <option value="Duplex">Duplex / Villa</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Rental Price (₦) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="180000"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">City / Town</label>
                <input
                  type="text"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  placeholder="Akungba"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Area / Landmark</label>
                <input
                  type="text"
                  value={locationArea}
                  onChange={(e) => setLocationArea(e.target.value)}
                  placeholder="e.g. Medoline Axis, Ebira Camp, AAUA Gate"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Bedrooms</label>
                <input
                  type="number"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  min="1"
                  max="10"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Bathrooms</label>
                <input
                  type="number"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  min="1"
                  max="10"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Detailed Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe room condition, water availability, electricity status, road access..."
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Primary Photo URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-2">Verified Amenities Included</label>
                <div className="flex flex-wrap gap-2">
                  {availableAmenities.map((item) => {
                    const isSelected = selectedAmenities.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleAmenity(item)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && '✓ '}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                Publish Listing
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
