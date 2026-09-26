// src/components/Navbar.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Home,
  Compass,
  Bookmark,
  ShoppingBag,
  Wallet,
  MessageSquare,
  Bell,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  PlusCircle,
  LogOut,
  ChevronDown,
  Sparkles,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  savedCount: number;
  onOpenWallet: () => void;
  onOpenMessages: () => void;
  onOpenNotifications: () => void;
  onOpenNewListing: () => void;
  onOpenAdmin: () => void;
  onOpenKeys?: () => void;
}

export function Navbar({
  currentTab,
  onNavigate,
  savedCount,
  onOpenWallet,
  onOpenMessages,
  onOpenNotifications,
  onOpenNewListing,
  onOpenAdmin,
  onOpenKeys,
}: NavbarProps) {
  const { currentUser, balanceVisible, toggleBalanceVisible, loginWithGoogle, loginAsDemo, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const formattedBalance = currentUser?.wallet?.balance
    ? `₦${currentUser.wallet.balance.toLocaleString()}`
    : '₦0.00';

  return (
    <>
      {/* Top Banner: Location context & escrow guarantee */}
      <div className="bg-emerald-950 text-emerald-100 text-[11px] py-1.5 px-4 font-medium border-b border-emerald-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              <strong>Akungba Akoko, Ondo State</strong> launch market active · 100% Escrow Key Handover Guarantee
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-emerald-300">
            <span>AAUA Campus & Residential Corridor</span>
            <span>·</span>
            <span className="text-coral-400 font-semibold">Zero Double-Allocation</span>
          </div>
        </div>
      </div>

      {/* Main Desktop Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform duration-200">
              <span className="font-serif text-2xl font-bold tracking-tighter">A</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-2xl font-bold tracking-tight text-slate-900">
                  ACCOOM
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-emerald-200/60 uppercase tracking-wider">
                  Verified
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium -mt-1 tracking-wide">
                Need somewhere to stay. Anywhere.
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                currentTab === 'home'
                  ? 'text-emerald-700 bg-emerald-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </button>

            <button
              onClick={() => onNavigate('browse')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                currentTab === 'browse'
                  ? 'text-emerald-700 bg-emerald-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4" />
              Browse
            </button>

            <button
              onClick={() => onNavigate('saved')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 relative ${
                currentTab === 'saved'
                  ? 'text-emerald-700 bg-emerald-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              Saved
              {savedCount > 0 && (
                <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-0.5">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('purchases')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                currentTab === 'purchases'
                  ? 'text-emerald-700 bg-emerald-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Purchases
            </button>
          </nav>

          {/* Right Action Bar: Wallet, Messages, Notifications, Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Wallet Balance Widget */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 pr-2.5 shadow-2xs hover:border-emerald-300 transition-colors">
              <button
                onClick={onOpenWallet}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-emerald-700 transition"
                title="Open ACCOOM Wallet"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase leading-none">
                    Balance
                  </div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {balanceVisible ? formattedBalance : '••••••••'}
                  </div>
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBalanceVisible();
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition"
                title={balanceVisible ? 'Hide Balance' : 'Show Balance'}
              >
                {balanceVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Messages Icon */}
            <button
              onClick={onOpenMessages}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              title="Messages"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Notifications Icon */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {currentUser?.unreadNotifications ? (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-coral-500 ring-2 ring-white" />
              ) : null}
            </button>

            {/* List Property CTA (For Agents / Landlords) */}
            <button
              onClick={onOpenNewListing}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Property</span>
            </button>

            {/* User Profile / Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition cursor-pointer"
              >
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {currentUser?.name ? currentUser.name[0] : 'U'}
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 divide-y divide-slate-100"
                >
                  <div className="p-3">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {currentUser?.name || 'ACCOOM Guest'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {currentUser?.email || 'Guest Explorer'}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {currentUser?.role || 'BUYER'}
                      </span>
                      {currentUser?.agentProfile?.verified && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Verified Agent
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Switch Demo Roles for testing */}
                  <div className="py-2 px-1">
                    <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Switch Role View (Demo)
                    </div>
                    <button
                      onClick={() => {
                        loginAsDemo('buyer');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between transition"
                    >
                      <span>Buyer: Funke (AAUA Student)</span>
                      {currentUser?.role === 'USER' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        loginAsDemo('agent');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between transition"
                    >
                      <span>Agent: Tunde (Balogun Prime)</span>
                      {currentUser?.role === 'AGENT' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        loginAsDemo('admin');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between transition"
                    >
                      <span>Admin: ACCOOM Compliance</span>
                      {currentUser?.role === 'ADMIN' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </button>
                  </div>

                  {/* Admin Dashboard shortcut if admin */}
                  {currentUser?.role === 'ADMIN' && (
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenAdmin();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Compliance Admin Dashboard
                      </button>
                    </div>
                  )}

                  {/* Sandbox Dummy Keys button */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenKeys && onOpenKeys();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition flex items-center gap-2"
                    >
                      <span className="text-sm">🔑</span>
                      Developer & Dummy Test Keys
                    </button>
                  </div>

                  {/* Google Sign In / Logout */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        loginWithGoogle();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-coral-500" />
                      Sign in with Google Account
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
            currentTab === 'home' ? 'text-emerald-600' : 'text-slate-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => onNavigate('browse')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
            currentTab === 'browse' ? 'text-emerald-600' : 'text-slate-500'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Browse</span>
        </button>

        <button
          onClick={() => onNavigate('saved')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium relative ${
            currentTab === 'saved' ? 'text-emerald-600' : 'text-slate-500'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span>Saved</span>
          {savedCount > 0 && (
            <span className="absolute -top-1 right-2 bg-emerald-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {savedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onNavigate('purchases')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
            currentTab === 'purchases' ? 'text-emerald-600' : 'text-slate-500'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Purchases</span>
        </button>

        <button
          onClick={onOpenWallet}
          className="flex flex-col items-center gap-1 text-[10px] font-medium text-slate-500"
        >
          <Wallet className="w-5 h-5 text-emerald-600" />
          <span>Wallet</span>
        </button>
      </nav>
    </>
  );
}
