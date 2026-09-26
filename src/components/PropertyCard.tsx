// src/components/PropertyCard.tsx
import React, { useState } from 'react';
import { Property } from '../types/index.ts';
import {
  MapPin,
  Bed,
  Bath,
  ShieldCheck,
  Heart,
  Star,
  Zap,
} from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onSelect: (property: Property) => void;
  onToggleSave: (propertyId: number, e: React.MouseEvent) => void;
  isSaved?: boolean;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80';

export function PropertyCard({ property, onSelect, onToggleSave, isSaved = false }: PropertyCardProps) {
  const [imgError, setImgError] = useState(false);
  const primaryImage = (property.images && property.images.length > 0)
    ? property.images[0]
    : FALLBACK_IMAGE;

  return (
    <div
      onClick={() => onSelect(property)}
      className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Image Container with Aspect Ratio */}
        <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
          <img
            src={imgError ? FALLBACK_IMAGE : primaryImage}
            alt={property.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500 ease-out"
            loading="lazy"
          />

          {/* Badges Overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
            {property.verified && (
              <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-md text-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-xs border border-emerald-100">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified
              </span>
            )}
            <span className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-medium px-2 py-0.5 rounded-full shadow-xs">
              {property.propertyType}
            </span>
          </div>

          {/* Save / Favorite Button */}
          <button
            onClick={(e) => onToggleSave(property.id, e)}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-transform duration-200 hover:scale-110 active:scale-95 shadow-sm ${
              isSaved
                ? 'bg-rose-500 text-white'
                : 'bg-white/90 text-slate-600 hover:text-rose-500'
            }`}
            title={isSaved ? 'Remove from saved' : 'Save property'}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>

          {/* Pricing Period Tag in bottom left of image */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-xs">
            <span className="text-sm font-bold text-slate-900">
              ₦{property.price.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 font-medium ml-1">
              /{property.pricingPeriod}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-2">
          {/* Location */}
          <div className="flex items-center gap-1 text-slate-500 text-xs font-medium truncate">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              {property.locationArea ? `${property.locationArea}, ` : ''}
              {property.locationCity}, {property.locationState}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {property.title}
          </h3>

          {/* Specifications (Bedrooms, Bathrooms, Furnished) */}
          <div className="flex items-center gap-3 pt-1 text-xs text-slate-600">
            <div className="flex items-center gap-1 font-medium">
              <Bed className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1 font-medium">
              <Bath className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
            </div>
            {property.furnished && (
              <>
                <span>•</span>
                <span className="text-emerald-700 font-medium">Furnished</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Agent or Rating information */}
      <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 truncate">
          <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[9px]">
            {property.agent?.businessName ? property.agent.businessName[0] : 'A'}
          </div>
          <span className="truncate max-w-[130px] font-medium text-slate-700">
            {property.agent?.businessName || 'Accredited Agent'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-600 font-semibold shrink-0">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>{property.agent?.rating || '4.9'}</span>
        </div>
      </div>
    </div>
  );
}
