// src/types/index.ts

export interface User {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: 'USER' | 'AGENT' | 'ADMIN';
  phone?: string;
  avatar?: string;
  location?: string;
  bio?: string;
  status: 'active' | 'suspended';
  createdAt: string;
  wallet?: {
    id: number;
    balance: number;
    currency: string;
  };
  agentProfile?: Agent | null;
  unreadNotifications?: number;
}

export interface Agent {
  id: number;
  userId: number;
  businessName: string;
  tier: 'Starter' | 'Rising' | 'Pro' | 'Top' | 'Master';
  verified: boolean;
  rating: string;
  reviewCount: number;
  completedTransactions: number;
  responseTime: string;
  responseRate: string;
  bio: string;
  location: string;
  phone: string;
  createdAt: string;
  user?: User;
}

export interface Property {
  id: number;
  agentId: number;
  title: string;
  slug: string;
  description: string;
  propertyType: string;
  locationCity: string;
  locationState: string;
  locationArea?: string;
  address?: string;
  price: number;
  currency: string;
  pricingPeriod: string;
  bedrooms: number;
  bathrooms: number;
  furnished: boolean;
  verified: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  images: string[];
  amenities: string[];
  rules?: string;
  viewCount: number;
  createdAt: string;
  agent?: Agent;
  isSaved?: boolean;
  savedAt?: string;
}

export interface Transaction {
  id: number;
  reference: string;
  buyerId: number;
  agentId: number;
  propertyId: number;
  amount: number;
  platformFee: number;
  currency: string;
  status: 'pending' | 'payment_pending' | 'paid' | 'awaiting_confirmation' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'disputed' | 'refunded';
  paymentProvider: string;
  paymentReference?: string;
  rentDuration: string;
  createdAt: string;
  updatedAt: string;
  property?: Property;
  agent?: Agent;
  buyer?: User;
}

export interface WalletLedgerItem {
  id: number;
  walletId: number;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'rent_payment' | 'payout' | 'refund';
  reference: string;
  description?: string;
  createdAt: string;
}

export interface Conversation {
  id: number;
  propertyId?: number;
  buyerId: number;
  agentId: number;
  lastMessage?: string;
  lastMessageAt: string;
  createdAt: string;
  property?: Property;
  buyer?: User;
  agent?: Agent;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  text: string;
  read: boolean;
  createdAt: string;
  sender?: User;
}

export interface NotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: 'message' | 'transaction' | 'payment' | 'system' | 'review';
  read: boolean;
  entityId?: string;
  createdAt: string;
}

export interface Review {
  id: number;
  userId: number;
  agentId: number;
  propertyId: number;
  transactionId?: number;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer?: User;
}
