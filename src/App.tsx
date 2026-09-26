// src/App.tsx
import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { SmartSearchBar } from './components/SmartSearchBar.tsx';
import { PropertyCard } from './components/PropertyCard.tsx';
import { PropertyDetailModal } from './components/PropertyDetailModal.tsx';
import { WalletModal } from './components/WalletModal.tsx';
import { BookingModal } from './components/BookingModal.tsx';
import { MessagesModal } from './components/MessagesModal.tsx';
import { NotificationsModal } from './components/NotificationsModal.tsx';
import { AgentDashboardModal } from './components/AgentDashboardModal.tsx';
import { AdminDashboardModal } from './components/AdminDashboardModal.tsx';
import { HandoverKeyModal } from './components/HandoverKeyModal.tsx';
import { DeveloperKeysModal } from './components/DeveloperKeysModal.tsx';
import { api } from './lib/api.ts';
import { Property, Transaction, Agent } from './types/index.ts';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Star,
  Users,
  Building,
  ArrowRight,
  Compass,
  Bookmark,
  Sparkles,
  MapPin,
  RefreshCw,
  ShoppingBag,
  Clock,
  ChevronRight,
  Filter,
  Key,
} from 'lucide-react';

function MainApp() {
  const { currentUser, refreshProfile } = useAuth();

  // Navigation & View State
  const [currentTab, setCurrentTab] = useState<'home' | 'browse' | 'saved' | 'purchases'>('home');

  // Properties State
  const [properties, setProperties] = useState<Property[]>([]);
  const [savedPropertiesList, setSavedPropertiesList] = useState<Property[]>([]);
  const [transactionsList, setTransactionsList] = useState<Transaction[]>([]);
  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // Modals State
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [bookingProperty, setBookingProperty] = useState<Property | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [messagesModalOpen, setMessagesModalOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [agentDashboardOpen, setAgentDashboardOpen] = useState(false);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);
  const [selectedHandoverTx, setSelectedHandoverTx] = useState<Transaction | null>(null);
  const [developerKeysModalOpen, setDeveloperKeysModalOpen] = useState(false);

  // Fetch properties from backend
  const loadProperties = async (filters: Record<string, any> = {}) => {
    try {
      setLoading(true);
      const res = await api.properties.list(filters);
      if (res && res.properties) {
        setProperties(res.properties);
      }
    } catch (err) {
      console.error('Failed to load properties:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch saved properties
  const loadSavedProperties = async () => {
    try {
      const res = await api.properties.getSaved();
      setSavedPropertiesList(res || []);
    } catch (err) {
      console.error('Failed to load saved properties:', err);
    }
  };

  // Fetch user transactions
  const loadTransactions = async () => {
    try {
      const res = await api.transactions.list();
      setTransactionsList(res || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  // Fetch agents list
  const loadAgents = async () => {
    try {
      const res = await api.agents.list();
      setAgentsList(res || []);
    } catch (err) {
      console.error('Failed to load agents:', err);
    }
  };

  useEffect(() => {
    loadProperties();
    loadAgents();
    loadSavedProperties();
    loadTransactions();
  }, []);

  const handleSearch = (filters: Record<string, any>) => {
    setActiveFilters(filters);
    setCurrentTab('browse');
    loadProperties(filters);
  };

  const handleToggleSave = async (propertyId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.properties.toggleSave(propertyId);
      // Update local state
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, isSaved: res.saved } : p))
      );
      if (selectedProperty && selectedProperty.id === propertyId) {
        setSelectedProperty((prev) => (prev ? { ...prev, isSaved: res.saved } : null));
      }
      loadSavedProperties();
    } catch (err) {
      console.error('Save toggle error:', err);
    }
  };

  const handleMessageAgent = async (prop: Property) => {
    try {
      const res = await api.conversations.start(
        prop.id,
        `Hello! I am interested in viewing '${prop.title}' in ${prop.locationCity}. Is physical inspection available today?`
      );
      setActiveConversationId(res.conversationId);
      setSelectedProperty(null);
      setMessagesModalOpen(true);
    } catch (err) {
      console.error('Start conversation error:', err);
    }
  };

  const handleBookingSuccess = (transaction: any) => {
    setBookingProperty(null);
    setSelectedProperty(null);
    loadTransactions();
    setCurrentTab('purchases');
  };

  const handleTransactionAction = async (txId: number, action: string) => {
    try {
      await api.transactions.action(txId, action);
      await loadTransactions();
      await refreshProfile();
    } catch (err) {
      console.error('Transaction action error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16 lg:pb-0">
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        onNavigate={(tab) => setCurrentTab(tab as typeof currentTab)}
        savedCount={savedPropertiesList.length}
        onOpenWallet={() => setWalletModalOpen(true)}
        onOpenMessages={() => setMessagesModalOpen(true)}
        onOpenNotifications={() => setNotificationsModalOpen(true)}
        onOpenNewListing={() => setAgentDashboardOpen(true)}
        onOpenAdmin={() => setAdminDashboardOpen(true)}
        onOpenKeys={() => setDeveloperKeysModalOpen(true)}
      />

      {/* Main Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* ========================================================= */}
        {/* VIEW 1: HOME PAGE                                         */}
        {/* ========================================================= */}
        {currentTab === 'home' && (
          <div className="space-y-16">
            {/* Hero Section */}
            <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 text-white p-8 sm:p-14 overflow-hidden shadow-2xl border border-slate-800">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-600/20 via-transparent to-transparent pointer-events-none" />

              <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Nigeria's Premier Escrow Property Marketplace
                </div>

                <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight text-white leading-tight">
                  Find a place you'll <span className="text-emerald-400 italic">love to stay.</span>
                </h1>

                <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                  Discover verified student lodges, self-contained rooms, serviced flats, and luxury residences across <strong>Akungba Akoko (AAUA)</strong>, Akure, Lagos, Abuja, and worldwide. 100% money-back escrow key handover guarantee.
                </p>

                {/* Integrated Smart Search */}
                <div className="pt-4 text-left">
                  <SmartSearchBar onSearch={handleSearch} />
                </div>
              </div>
            </div>

            {/* Popular Locations Highlight */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-900">
                    Explore Popular Locations
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Search student campus corridors and executive urban districts
                  </p>
                </div>
                <button
                  onClick={() => setCurrentTab('browse')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  View All Listings <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  {
                    city: 'Akungba',
                    label: 'Akungba Akoko',
                    meta: 'AAUA Campus Corridor · 180+ Lodges',
                    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
                  },
                  {
                    city: 'Akure',
                    label: 'Akure GRA',
                    meta: 'Alagbaka & Ijapo Residences',
                    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
                  },
                  {
                    city: 'Lagos',
                    label: 'Lagos Island',
                    meta: 'Lekki Phase 1, Victoria Island & Ikeja',
                    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
                  },
                  {
                    city: 'Abuja',
                    label: 'Abuja FCT',
                    meta: 'Maitama, Wuse 2 & Gwarinpa',
                    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
                  },
                ].map((item) => (
                  <div
                    key={item.city}
                    onClick={() => handleSearch({ location: item.city })}
                    className="group relative rounded-2xl overflow-hidden aspect-4/3 cursor-pointer shadow-sm hover:shadow-md transition duration-300"
                  >
                    <img
                      src={item.image}
                      alt={item.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-4 text-white">
                      <h3 className="font-serif font-bold text-base text-white group-hover:text-emerald-300 transition-colors">
                        {item.label}
                      </h3>
                      <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                        {item.meta}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Verified Listings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-900">
                    Recommended Accommodation
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Inspected for running water, pre-paid electricity meters, and security
                  </p>
                </div>
                <button
                  onClick={() => setCurrentTab('browse')}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  Browse all {properties.length} properties <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 animate-pulse">
                      <div className="aspect-4/3 bg-slate-200 rounded-xl" />
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.slice(0, 6).map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onSelect={(prop) => setSelectedProperty(prop)}
                      onToggleSave={handleToggleSave}
                      isSaved={property.isSaved}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Why ACCOOM — Trust Pillars (Section 2 & 17) */}
            <div className="rounded-3xl bg-white border border-slate-200 p-8 sm:p-12 shadow-sm space-y-8">
              <div className="max-w-2xl">
                <span className="text-xs uppercase font-semibold text-emerald-700 tracking-wider">
                  The Marketplace Standard
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
                  Why ACCOOM is Built Different
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  Renting in university towns and urban centers has traditionally been fraught with fake agents, non-existent rooms, and double-allocation scams. We solved it with financial architecture.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    icon: Lock,
                    title: '100% Escrow Protection',
                    desc: 'Your rent deposit stays in ACCOOM escrow. Funds are never released until you inspect the property and take keys.',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Physical Site Audits',
                    desc: 'Every lodge in Akungba and beyond is verified for water boreholes, individual meters, and fencing.',
                  },
                  {
                    icon: Users,
                    title: 'Accredited Partner Agents',
                    desc: 'Agents undergo strict KYC identity verification and tier qualification based on verified completion metrics.',
                  },
                  {
                    icon: CheckCircle2,
                    title: 'Zero Double-Allocation',
                    desc: 'A room reserved on ACCOOM is locked in our database ledger. No two students can ever pay for the same room.',
                  },
                ].map((feature, idx) => {
                  const Icon = feature.icon;
                  return (
                    <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm">{feature.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{feature.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trusted Agents Showcase */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-slate-900">
                    Trusted Housing Agents
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Accredited brokers with verified completed transactions
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {agentsList.map((agent) => (
                  <div
                    key={agent.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={agent.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                        alt={agent.businessName}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{agent.businessName}</h4>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{agent.location}</p>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700">
                          {agent.tier} Partner
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {agent.bio}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 text-slate-700 font-semibold">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {agent.rating} ({agent.reviewCount})
                      </span>
                      <span>Resp: {agent.responseTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Banner */}
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl shadow-emerald-600/15">
              <div className="max-w-xl space-y-2">
                <h3 className="text-2xl font-serif font-bold text-white">
                  Are you a landlord or accredited agent?
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                  List your verified hostels, apartments and self-contains to thousands of ready students and tenants in Akungba Akoko, Akure, and across Nigeria.
                </p>
              </div>
              <button
                onClick={() => setAgentDashboardOpen(true)}
                className="px-6 py-3 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold transition shadow-md shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <span>Publish Listing Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: BROWSE LISTINGS                                   */}
        {/* ========================================================= */}
        {currentTab === 'browse' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-serif font-bold text-slate-900">
                Browse Verified Properties
              </h1>
              <p className="text-xs text-slate-500">
                Live marketplace index with instant escrow booking capability
              </p>
            </div>

            {/* Smart Search Filter Header */}
            <SmartSearchBar onSearch={handleSearch} />

            {/* Results Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 animate-pulse">
                    <div className="aspect-4/3 bg-slate-200 rounded-xl" />
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
                <Building className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No properties matched your search.</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Try clearing your filters or searching for "Akungba", "Self-Contained", or "Akure".
                </p>
                <button
                  onClick={() => loadProperties({})}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onSelect={(prop) => setSelectedProperty(prop)}
                    onToggleSave={handleToggleSave}
                    isSaved={property.isSaved}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: SAVED PROPERTIES                                  */}
        {/* ========================================================= */}
        {currentTab === 'saved' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-900">
                Your Saved Accommodations
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Lodges and apartments saved to your personal shortlist
              </p>
            </div>

            {savedPropertiesList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
                <Bookmark className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">Your saved list is empty</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Browse properties and tap the heart icon on any accommodation to save it for later comparison.
                </p>
                <button
                  onClick={() => setCurrentTab('browse')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
                >
                  Browse Accommodations
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedPropertiesList.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onSelect={(prop) => setSelectedProperty(prop)}
                    onToggleSave={handleToggleSave}
                    isSaved={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: PURCHASES / BOOKINGS LIFECYCLE                     */}
        {/* ========================================================= */}
        {currentTab === 'purchases' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-900">
                Escrow Bookings & Transactions
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Track payments, physical inspections, and key handover status
              </p>
            </div>

            {transactionsList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No active bookings yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When you reserve a lodge with ACCOOM Escrow, your transaction and handover status will appear here.
                </p>
                <button
                  onClick={() => setCurrentTab('browse')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition"
                >
                  Explore Available Rooms
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {transactionsList.map((tx) => {
                  const isPaid = tx.status === 'paid';
                  const isCompleted = tx.status === 'completed';
                  const isDisputed = tx.status === 'disputed';

                  return (
                    <div
                      key={tx.id}
                      className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            Ref: {tx.reference}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : isPaid
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : isDisputed
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isCompleted
                              ? 'Fulfilled ✓ Keys Handed Over'
                              : isPaid
                              ? 'Funds Safe in Escrow · Awaiting Physical Handover'
                              : tx.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={tx.property?.images[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=300&q=80'}
                            alt={tx.property?.title}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{tx.property?.title}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {tx.property?.locationCity}, {tx.property?.locationState} · Lease: {tx.rentDuration}
                            </p>
                            <div className="text-xs font-semibold text-emerald-700 mt-1 font-mono">
                              Total Deposited: ₦{tx.amount.toLocaleString()} (incl. ₦{tx.platformFee.toLocaleString()} escrow guarantee)
                            </div>
                          </div>
                        </div>

                        {/* Lifecycle Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setSelectedHandoverTx(tx)}
                            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-emerald-200 cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Digital Handover Key</span>
                          </button>
                          {isPaid && (
                            <>
                              <button
                                onClick={() => handleTransactionAction(tx.id, 'confirm_keys')}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Confirm Handover
                              </button>
                              <button
                                onClick={() => handleTransactionAction(tx.id, 'open_dispute')}
                                className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl transition cursor-pointer"
                              >
                                Report Issue
                              </button>
                            </>
                          )}
                          {isCompleted && (
                            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Tenancy Active & Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL DIALOGS                                             */}
      {/* ========================================================= */}

      {/* Property Details Modal */}
      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onBook={(prop) => {
            setSelectedProperty(null);
            setBookingProperty(prop);
          }}
          onMessageAgent={handleMessageAgent}
          onToggleSave={handleToggleSave}
          isSaved={selectedProperty.isSaved}
        />
      )}

      {/* Booking Checkout Modal */}
      {bookingProperty && (
        <BookingModal
          property={bookingProperty}
          onClose={() => setBookingProperty(null)}
          onSuccess={handleBookingSuccess}
          onOpenWallet={() => setWalletModalOpen(true)}
        />
      )}

      {/* Wallet & Ledger Modal */}
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />

      {/* Messaging Modal */}
      <MessagesModal
        isOpen={messagesModalOpen}
        onClose={() => {
          setMessagesModalOpen(false);
          setActiveConversationId(null);
        }}
        activeConversationId={activeConversationId}
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
      />

      {/* Agent Partner Portal Modal */}
      <AgentDashboardModal
        isOpen={agentDashboardOpen}
        onClose={() => setAgentDashboardOpen(false)}
        onPropertyCreated={() => {
          loadProperties();
          loadAgents();
        }}
      />

      {/* Admin Compliance Modal */}
      <AdminDashboardModal
        isOpen={adminDashboardOpen}
        onClose={() => setAdminDashboardOpen(false)}
      />

      {/* Digital Handover Key & Access Code Modal */}
      <HandoverKeyModal
        transaction={selectedHandoverTx}
        isOpen={Boolean(selectedHandoverTx)}
        onClose={() => setSelectedHandoverTx(null)}
        onHandoverComplete={() => {
          loadTransactions();
          refreshProfile();
        }}
      />

      {/* Developer Sandbox & Dummy Keys Modal */}
      <DeveloperKeysModal
        isOpen={developerKeysModalOpen}
        onClose={() => setDeveloperKeysModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-slate-500">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold text-slate-900">ACCOOM</span>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                Verified Accommodation Platform
              </span>
            </div>
            <p className="text-slate-400">
              Launch market: Akungba Akoko, Ondo State (AAUA Campus Corridor) · Expanding globally
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button onClick={() => setCurrentTab('browse')} className="hover:text-slate-800">
              Browse Lodges
            </button>
            <button onClick={() => setAgentDashboardOpen(true)} className="hover:text-slate-800">
              Agent Portal
            </button>
            <button onClick={() => setWalletModalOpen(true)} className="hover:text-slate-800">
              Escrow Protection
            </button>
            {currentUser?.role === 'ADMIN' && (
              <button onClick={() => setAdminDashboardOpen(true)} className="text-emerald-700 font-semibold">
                Admin Console
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
