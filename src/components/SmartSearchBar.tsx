// src/components/SmartSearchBar.tsx
import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

interface SmartSearchBarProps {
  onSearch: (filters: Record<string, any>) => void;
  initialQuery?: string;
}

export function SmartSearchBar({ onSearch, initialQuery = '' }: SmartSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Advanced filter states
  const [propertyType, setPropertyType] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [furnishedOnly, setFurnishedOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState('relevance');

  const popularLocations = ['All', 'Akungba', 'Akure', 'Lagos', 'Abuja'];

  const handleExecuteSearch = (customLocation?: string) => {
    const loc = customLocation !== undefined ? customLocation : selectedLocation;
    const filterObj: Record<string, any> = {
      q: query,
      sort,
    };

    if (loc && loc !== 'All') {
      filterObj.location = loc;
    }
    if (propertyType) filterObj.type = propertyType;
    if (bedrooms) filterObj.bedrooms = bedrooms;
    if (maxPrice) filterObj.maxPrice = maxPrice;
    if (furnishedOnly) filterObj.furnished = 'true';
    if (verifiedOnly) filterObj.verified = 'true';

    onSearch(filterObj);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleExecuteSearch();
    }
  };

  const clearAllFilters = () => {
    setQuery('');
    setSelectedLocation('All');
    setPropertyType('');
    setBedrooms('');
    setMaxPrice('');
    setFurnishedOnly(false);
    setVerifiedOnly(false);
    setSort('relevance');
    onSearch({});
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3">
      {/* Primary Search Bar Container */}
      <div className="relative bg-white rounded-2xl p-2 sm:p-2.5 shadow-md shadow-slate-200/50 border border-slate-200/90 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search input with NLP interpretation icon */}
        <div className="flex-1 flex items-center px-3 gap-2.5">
          <Search className="w-5 h-5 text-emerald-600 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Try 'cheap self contain in akungba', '2 bedroom akure', 'furnished'..."
            className="w-full text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none py-2"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                handleExecuteSearch();
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <div className="flex items-center gap-2 px-1">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
              isFilterOpen || propertyType || bedrooms || maxPrice || furnishedOnly
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {(propertyType || bedrooms || maxPrice || furnishedOnly) && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* Search Button */}
          <button
            onClick={() => handleExecuteSearch()}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Location Pills & Quick Suggestions */}
      <div className="flex items-center justify-between overflow-x-auto pb-1 gap-2 scrollbar-none text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Hotspots:
          </span>
          {popularLocations.map((loc) => {
            const isSelected = selectedLocation === loc;
            return (
              <button
                key={loc}
                onClick={() => {
                  setSelectedLocation(loc);
                  handleExecuteSearch(loc);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                {loc === 'All' ? 'All Locations' : loc}
              </button>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-coral-500" />
          <span>Fuzzy & typo-tolerant search active</span>
        </div>
      </div>

      {/* Detailed Filter Panel Dropdown */}
      {isFilterOpen && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              Filter Accommodation Preferences
            </h4>
            <button
              onClick={clearAllFilters}
              className="text-xs text-rose-600 hover:underline font-medium"
            >
              Reset All
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* Property Type */}
            <div>
              <label className="font-semibold text-slate-700 mb-1.5 block">
                Property Type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Any Type</option>
                <option value="Self-Contained">Self-Contained Lodge</option>
                <option value="1 Bedroom Flat">1 Bedroom Flat</option>
                <option value="2 Bedroom Flat">2 Bedroom Flat</option>
                <option value="Room & Parlour">Room & Parlour</option>
                <option value="Studio">Studio Apartment</option>
                <option value="Duplex">Duplex / Villa</option>
              </select>
            </div>

            {/* Bedrooms */}
            <div>
              <label className="font-semibold text-slate-700 mb-1.5 block">
                Bedrooms
              </label>
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="">Any count</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3+ Bedrooms</option>
              </select>
            </div>

            {/* Max Budget */}
            <div>
              <label className="font-semibold text-slate-700 mb-1.5 block">
                Max Price (₦/year)
              </label>
              <select
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="">No Maximum</option>
                <option value="150000">Up to ₦150,000</option>
                <option value="250000">Up to ₦250,000</option>
                <option value="400000">Up to ₦400,000</option>
                <option value="1000000">Up to ₦1,000,000</option>
                <option value="3000000">Up to ₦3,000,000</option>
              </select>
            </div>

            {/* Sorting */}
            <div>
              <label className="font-semibold text-slate-700 mb-1.5 block">
                Sort Results
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="relevance">Relevance & Verified</option>
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="most_viewed">Most Viewed</option>
              </select>
            </div>
          </div>

          {/* Toggles: Furnished & Verified */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={furnishedOnly}
                  onChange={(e) => setFurnishedOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                Furnished Only
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                Verified Host Listings Only
              </label>
            </div>

            <button
              onClick={() => {
                handleExecuteSearch();
                setIsFilterOpen(false);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
