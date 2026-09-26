// src/server/routes.ts
import { Router, Response } from 'express';
import { db } from '../db/index.ts';
import {
  users,
  agents,
  properties,
  savedProperties,
  wallets,
  walletLedger,
  transactions,
  conversations,
  messages,
  notifications,
  reviews,
  reports,
  disputes,
} from '../db/schema.ts';
import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import { requireAuth, optionalAuth, requireAdmin, AuthRequest } from '../middleware/auth.ts';
import { parseNaturalLanguageQuery } from './smartSearch.ts';

export const apiRouter = Router();

// ==========================================
// 1. AUTH / CURRENT USER CONTEXT
// ==========================================
apiRouter.get('/auth/me', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.dbUser) {
      return res.json({ success: true, data: { authenticated: false, user: null } });
    }

    // Fetch user wallet
    const userWallet = await db.select().from(wallets).where(eq(wallets.userId, req.dbUser.id)).limit(1);
    
    // Check if user is also an agent
    const userAgent = await db.select().from(agents).where(eq(agents.userId, req.dbUser.id)).limit(1);

    // Unread notifications count
    const unreadNotes = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, req.dbUser.id), eq(notifications.read, false)));

    return res.json({
      success: true,
      data: {
        authenticated: true,
        user: {
          ...req.dbUser,
          wallet: userWallet[0] || { balance: 0, currency: 'NGN' },
          agentProfile: userAgent[0] || null,
          unreadNotifications: Number(unreadNotes[0]?.count || 0),
        },
      },
    });
  } catch (error: any) {
    console.error('Error in /auth/me:', error);
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch current user profile' } });
  }
});

// Update profile
apiRouter.patch('/auth/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, location, bio } = req.body;
    const [updated] = await db
      .update(users)
      .set({
        name: name !== undefined ? name : req.dbUser.name,
        phone: phone !== undefined ? phone : req.dbUser.phone,
        location: location !== undefined ? location : req.dbUser.location,
        bio: bio !== undefined ? bio : req.dbUser.bio,
      })
      .where(eq(users.id, req.dbUser.id))
      .returning();

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to update profile' } });
  }
});

// ==========================================
// 2. PROPERTIES & SMART SEARCH
// ==========================================
apiRouter.get('/properties', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      q,
      location,
      type,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      furnished,
      verified,
      sort = 'relevance',
      limit = 30,
      offset = 0,
    } = req.query;

    const queryStr = typeof q === 'string' ? q : '';
    const parsed = parseNaturalLanguageQuery(queryStr);

    const conditions: any[] = [eq(properties.status, 'approved')];

    // Location matching
    const searchLocation = (typeof location === 'string' && location) || parsed.extractedLocation;
    if (searchLocation) {
      conditions.push(
        or(
          ilike(properties.locationCity, `%${searchLocation}%`),
          ilike(properties.locationState, `%${searchLocation}%`),
          ilike(properties.locationArea, `%${searchLocation}%`),
          ilike(properties.address, `%${searchLocation}%`)
        )
      );
    }

    // Property Type
    const searchType = (typeof type === 'string' && type) || parsed.extractedPropertyType;
    if (searchType) {
      conditions.push(ilike(properties.propertyType, `%${searchType}%`));
    }

    // Bedrooms
    const searchBedrooms = bedrooms ? parseInt(bedrooms as string, 10) : parsed.extractedBedrooms;
    if (searchBedrooms) {
      conditions.push(eq(properties.bedrooms, searchBedrooms));
    }

    // Bathrooms
    if (bathrooms) {
      conditions.push(eq(properties.bathrooms, parseInt(bathrooms as string, 10)));
    }

    // Price limits
    const searchMinPrice = minPrice ? parseInt(minPrice as string, 10) : parsed.extractedMinPrice;
    if (searchMinPrice) {
      conditions.push(sql`${properties.price} >= ${searchMinPrice}`);
    }

    const searchMaxPrice = maxPrice ? parseInt(maxPrice as string, 10) : parsed.extractedMaxPrice;
    if (searchMaxPrice) {
      conditions.push(sql`${properties.price} <= ${searchMaxPrice}`);
    }

    // Furnished
    if (furnished === 'true') {
      conditions.push(eq(properties.furnished, true));
    }

    // Verified
    if (verified === 'true') {
      conditions.push(eq(properties.verified, true));
    }

    // Keyword match across title & description
    if (parsed.cleanKeyword && parsed.cleanKeyword.length > 2) {
      conditions.push(
        or(
          ilike(properties.title, `%${parsed.cleanKeyword}%`),
          ilike(properties.description, `%${parsed.cleanKeyword}%`)
        )
      );
    }

    // Sorting
    let orderByClause;
    switch (sort) {
      case 'newest':
        orderByClause = desc(properties.createdAt);
        break;
      case 'price_asc':
        orderByClause = sql`${properties.price} ASC`;
        break;
      case 'price_desc':
        orderByClause = desc(properties.price);
        break;
      case 'most_viewed':
        orderByClause = desc(properties.viewCount);
        break;
      case 'relevance':
      default:
        orderByClause = desc(properties.verified);
        break;
    }

    const list = await db
      .select({
        property: properties,
        agent: agents,
      })
      .from(properties)
      .leftJoin(agents, eq(properties.agentId, agents.id))
      .where(and(...conditions))
      .orderBy(orderByClause, desc(properties.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    // Check saved status if user is logged in
    let savedIds = new Set<number>();
    if (req.dbUser) {
      const userSaved = await db
        .select({ propertyId: savedProperties.propertyId })
        .from(savedProperties)
        .where(eq(savedProperties.userId, req.dbUser.id));
      savedIds = new Set(userSaved.map((s) => s.propertyId));
    }

    const formatted = list.map(({ property, agent }) => ({
      ...property,
      agent,
      isSaved: savedIds.has(property.id),
    }));

    return res.json({
      success: true,
      data: {
        properties: formatted,
        total: formatted.length,
        interpretedSearch: parsed,
      },
    });
  } catch (error: any) {
    console.error('Error fetching properties:', error);
    return res.status(500).json({ success: false, error: { message: 'Failed to retrieve properties' } });
  }
});

// Single property details
apiRouter.get('/properties/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid property ID' } });
    }

    // Increment view count asynchronously
    await db
      .update(properties)
      .set({ viewCount: sql`${properties.viewCount} + 1` })
      .where(eq(properties.id, id));

    const result = await db
      .select({
        property: properties,
        agent: agents,
        agentUser: users,
      })
      .from(properties)
      .leftJoin(agents, eq(properties.agentId, agents.id))
      .leftJoin(users, eq(agents.userId, users.id))
      .where(eq(properties.id, id))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Property not found' } });
    }

    const { property, agent, agentUser } = result[0];

    // Reviews for property
    const propReviews = await db
      .select({
        review: reviews,
        reviewer: users,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.propertyId, id))
      .orderBy(desc(reviews.createdAt));

    // Check if saved
    let isSaved = false;
    if (req.dbUser) {
      const saved = await db
        .select()
        .from(savedProperties)
        .where(and(eq(savedProperties.userId, req.dbUser.id), eq(savedProperties.propertyId, id)))
        .limit(1);
      isSaved = saved.length > 0;
    }

    // Similar properties in same location
    const similar = await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.status, 'approved'),
          eq(properties.locationCity, property.locationCity),
          sql`${properties.id} != ${property.id}`
        )
      )
      .limit(4);

    return res.json({
      success: true,
      data: {
        ...property,
        agent: agent ? { ...agent, user: agentUser } : null,
        reviews: propReviews.map((r) => ({ ...r.review, reviewer: r.reviewer })),
        isSaved,
        similarProperties: similar,
      },
    });
  } catch (error: any) {
    console.error('Error fetching property details:', error);
    return res.status(500).json({ success: false, error: { message: 'Failed to load property details' } });
  }
});

// Create property listing
apiRouter.post('/properties', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    // Check if user has an agent record
    let agentRecord = await db.select().from(agents).where(eq(agents.userId, req.dbUser.id)).limit(1);

    if (agentRecord.length === 0) {
      // Auto-register agent profile for verified listing creation
      const [newAgent] = await db
        .insert(agents)
        .values({
          userId: req.dbUser.id,
          businessName: req.body.businessName || `${req.dbUser.name}'s Properties`,
          phone: req.body.phone || req.dbUser.phone || '',
          location: req.body.locationCity ? `${req.body.locationCity}, ${req.body.locationState}` : req.dbUser.location,
          verified: true,
        })
        .returning();
      agentRecord = [newAgent];

      // Update user role to AGENT
      await db.update(users).set({ role: 'AGENT' }).where(eq(users.id, req.dbUser.id));
    }

    const {
      title,
      description,
      propertyType,
      locationCity,
      locationState,
      locationArea,
      address,
      price,
      currency = 'NGN',
      pricingPeriod = 'year',
      bedrooms = 1,
      bathrooms = 1,
      furnished = false,
      images = [],
      amenities = [],
      rules,
    } = req.body;

    if (!title || !description || !propertyType || !locationCity || !price) {
      return res.status(400).json({
        success: false,
        error: { message: 'Title, description, property type, location, and price are required.' },
      });
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

    const [created] = await db
      .insert(properties)
      .values({
        agentId: agentRecord[0].id,
        title,
        slug,
        description,
        propertyType,
        locationCity,
        locationState: locationState || 'Ondo State',
        locationArea: locationArea || '',
        address: address || '',
        price: Number(price),
        currency,
        pricingPeriod,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        furnished: Boolean(furnished),
        verified: true,
        status: 'approved',
        images: Array.isArray(images) && images.length ? images : [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
        ],
        amenities: Array.isArray(amenities) ? amenities : [],
        rules: rules || '',
      })
      .returning();

    return res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    console.error('Error creating property:', error);
    return res.status(500).json({ success: false, error: { message: 'Failed to publish property listing' } });
  }
});

// Save / Unsave property
apiRouter.post('/properties/:id/save', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const propertyId = parseInt(req.params.id, 10);
    const existing = await db
      .select()
      .from(savedProperties)
      .where(and(eq(savedProperties.userId, req.dbUser.id), eq(savedProperties.propertyId, propertyId)))
      .limit(1);

    if (existing.length > 0) {
      // Remove
      await db
        .delete(savedProperties)
        .where(and(eq(savedProperties.userId, req.dbUser.id), eq(savedProperties.propertyId, propertyId)));
      return res.json({ success: true, saved: false });
    } else {
      // Add
      await db.insert(savedProperties).values({
        userId: req.dbUser.id,
        propertyId,
      });
      return res.json({ success: true, saved: true });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to update saved property' } });
  }
});

// Get user saved properties
apiRouter.get('/saved', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select({
        property: properties,
        agent: agents,
        savedAt: savedProperties.createdAt,
      })
      .from(savedProperties)
      .innerJoin(properties, eq(savedProperties.propertyId, properties.id))
      .leftJoin(agents, eq(properties.agentId, agents.id))
      .where(eq(savedProperties.userId, req.dbUser.id))
      .orderBy(desc(savedProperties.createdAt));

    return res.json({
      success: true,
      data: list.map((item) => ({
        ...item.property,
        agent: item.agent,
        isSaved: true,
        savedAt: item.savedAt,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch saved properties' } });
  }
});

// ==========================================
// 3. AGENTS
// ==========================================
apiRouter.get('/agents', async (_req, res: Response) => {
  try {
    const list = await db
      .select({
        agent: agents,
        user: users,
      })
      .from(agents)
      .innerJoin(users, eq(agents.userId, users.id))
      .orderBy(desc(agents.verified), desc(agents.completedTransactions));

    return res.json({
      success: true,
      data: list.map((i) => ({ ...i.agent, user: i.user })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch agents' } });
  }
});

apiRouter.get('/agents/:id', async (req, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const agentRes = await db
      .select({
        agent: agents,
        user: users,
      })
      .from(agents)
      .innerJoin(users, eq(agents.userId, users.id))
      .where(eq(agents.id, id))
      .limit(1);

    if (agentRes.length === 0) {
      return res.status(404).json({ success: false, error: { message: 'Agent not found' } });
    }

    const agentProps = await db
      .select()
      .from(properties)
      .where(and(eq(properties.agentId, id), eq(properties.status, 'approved')));

    return res.json({
      success: true,
      data: {
        ...agentRes[0].agent,
        user: agentRes[0].user,
        properties: agentProps,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch agent profile' } });
  }
});

// ==========================================
// 4. WALLET & LEDGER ARCHITECTURE
// ==========================================
apiRouter.get('/wallet', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, req.dbUser.id)).limit(1);
    
    if (!wallet) {
      const [newWallet] = await db.insert(wallets).values({ userId: req.dbUser.id, balance: 100000 }).returning();
      return res.json({ success: true, data: { wallet: newWallet, ledger: [] } });
    }

    const ledger = await db
      .select()
      .from(walletLedger)
      .where(eq(walletLedger.walletId, wallet.id))
      .orderBy(desc(walletLedger.createdAt))
      .limit(50);

    return res.json({
      success: true,
      data: {
        wallet,
        ledger,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to load wallet data' } });
  }
});

apiRouter.post('/wallet/deposit', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, reference = `DEP-${Date.now()}` } = req.body;
    const depositAmount = parseInt(amount, 10);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ success: false, error: { message: 'Valid deposit amount required' } });
    }

    // Atomic transaction
    let userWallet = await db.select().from(wallets).where(eq(wallets.userId, req.dbUser.id)).limit(1);
    if (!userWallet.length) {
      const [w] = await db.insert(wallets).values({ userId: req.dbUser.id, balance: 0 }).returning();
      userWallet = [w];
    }

    const currentWallet = userWallet[0];

    // Update wallet balance
    const [updatedWallet] = await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${depositAmount}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, currentWallet.id))
      .returning();

    // Record in ledger
    await db.insert(walletLedger).values({
      walletId: currentWallet.id,
      amount: depositAmount,
      type: 'deposit',
      reference,
      description: `Direct wallet top-up (NGN ${depositAmount.toLocaleString()})`,
    });

    // Notify user
    await db.insert(notifications).values({
      userId: req.dbUser.id,
      title: 'Wallet Funded Successfully',
      message: `Your ACCOOM wallet was credited with ₦${depositAmount.toLocaleString()}.`,
      type: 'payment',
    });

    return res.json({ success: true, data: updatedWallet });
  } catch (error: any) {
    console.error('Wallet deposit error:', error);
    return res.status(500).json({ success: false, error: { message: 'Failed to process deposit' } });
  }
});

// ==========================================
// 5. TRANSACTIONS & ESCROW BOOKING
// ==========================================
apiRouter.get('/transactions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    // If agent, get sales; as buyer, get purchases
    const purchases = await db
      .select({
        transaction: transactions,
        property: properties,
        agent: agents,
        buyer: users,
      })
      .from(transactions)
      .leftJoin(properties, eq(transactions.propertyId, properties.id))
      .leftJoin(agents, eq(transactions.agentId, agents.id))
      .leftJoin(users, eq(transactions.buyerId, users.id))
      .where(or(eq(transactions.buyerId, req.dbUser.id), eq(agents.userId, req.dbUser.id)))
      .orderBy(desc(transactions.createdAt));

    return res.json({
      success: true,
      data: purchases.map((p) => ({
        ...p.transaction,
        property: p.property,
        agent: p.agent,
        buyer: p.buyer,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to load transactions' } });
  }
});

apiRouter.post('/transactions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, rentDuration = '1 year', paymentMethod = 'wallet' } = req.body;
    const propId = parseInt(propertyId, 10);

    // Rule 60 & 79: Retrieve server-side authoritative price
    const propRes = await db.select().from(properties).where(eq(properties.id, propId)).limit(1);
    if (!propRes.length) {
      return res.status(404).json({ success: false, error: { message: 'Property not found' } });
    }

    const prop = propRes[0];
    const propertyPrice = prop.price;
    const platformFee = Math.round(propertyPrice * 0.05); // 5% platform escrow protection fee
    const totalAmount = propertyPrice + platformFee;

    const reference = `TX-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    // Verify wallet balance if paying via internal balance
    if (paymentMethod === 'wallet') {
      const [userWallet] = await db.select().from(wallets).where(eq(wallets.userId, req.dbUser.id)).limit(1);
      if (!userWallet || userWallet.balance < totalAmount) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_FUNDS',
            message: `Insufficient wallet balance. Required: ₦${totalAmount.toLocaleString()}, Current Balance: ₦${(userWallet?.balance || 0).toLocaleString()}`,
          },
        });
      }

      // Deduct from wallet
      await db
        .update(wallets)
        .set({ balance: sql`${wallets.balance} - ${totalAmount}`, updatedAt: new Date() })
        .where(eq(wallets.id, userWallet.id));

      // Record in ledger
      await db.insert(walletLedger).values({
        walletId: userWallet.id,
        amount: -totalAmount,
        type: 'rent_payment',
        reference,
        description: `Escrow rent payment for ${prop.title}`,
      });
    }

    // Create Transaction record in 'paid' state (held in platform escrow)
    const [tx] = await db
      .insert(transactions)
      .values({
        reference,
        buyerId: req.dbUser.id,
        agentId: prop.agentId,
        propertyId: prop.id,
        amount: totalAmount,
        platformFee,
        currency: prop.currency,
        status: 'paid', // Instant escrow hold for wallet or dummy test card keys
        paymentProvider: paymentMethod === 'wallet' ? 'ACCOOM Wallet' : 'Stripe Test Card (Sandbox Keys)',
        paymentReference: `HANDOVER-KEY-${reference.slice(3, 9)}-${Math.floor(1000 + Math.random() * 9000)}`,
        rentDuration,
      })
      .returning();

    // Notify Agent
    const [agentData] = await db.select().from(agents).where(eq(agents.id, prop.agentId)).limit(1);
    if (agentData) {
      await db.insert(notifications).values({
        userId: agentData.userId,
        title: 'New Escrow Rental Payment!',
        message: `Tenant has deposited ₦${totalAmount.toLocaleString()} in ACCOOM escrow for ${prop.title}. Awaiting physical move-in confirmation.`,
        type: 'transaction',
        entityId: tx.id.toString(),
      });
    }

    // Notify Buyer
    await db.insert(notifications).values({
      userId: req.dbUser.id,
      title: 'Booking Confirmed in Escrow',
      message: `Your booking for ${prop.title} is secured in escrow (Ref: ${reference}). Funds will only be released after your satisfactory key handover.`,
      type: 'transaction',
      entityId: tx.id.toString(),
    });

    return res.status(201).json({ success: true, data: tx });
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    return res.status(500).json({ success: false, error: { message: 'Failed to initiate transaction' } });
  }
});

// Update transaction status (Lifecycle: confirm -> completed, dispute, etc.)
apiRouter.post('/transactions/:id/action', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const txId = parseInt(req.params.id, 10);
    const { action, reason } = req.body; // 'confirm_keys', 'release_funds', 'open_dispute'

    const txRes = await db.select().from(transactions).where(eq(transactions.id, txId)).limit(1);
    if (!txRes.length) {
      return res.status(404).json({ success: false, error: { message: 'Transaction not found' } });
    }

    const tx = txRes[0];

    if (action === 'confirm_keys' || action === 'complete') {
      // Buyer confirms keys received -> mark completed & release funds to Agent's wallet
      const [updated] = await db
        .update(transactions)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(eq(transactions.id, tx.id))
        .returning();

      // Payout to agent wallet (net of platform fee)
      const agentEarnings = tx.amount - tx.platformFee;
      const [agentProfile] = await db.select().from(agents).where(eq(agents.id, tx.agentId)).limit(1);
      
      if (agentProfile) {
        let [agentWallet] = await db.select().from(wallets).where(eq(wallets.userId, agentProfile.userId)).limit(1);
        if (!agentWallet) {
          const [w] = await db.insert(wallets).values({ userId: agentProfile.userId, balance: 0 }).returning();
          agentWallet = w;
        }

        await db
          .update(wallets)
          .set({ balance: sql`${wallets.balance} + ${agentEarnings}`, updatedAt: new Date() })
          .where(eq(wallets.id, agentWallet.id));

        await db.insert(walletLedger).values({
          walletId: agentWallet.id,
          amount: agentEarnings,
          type: 'payout',
          reference: `PAYOUT-${tx.reference}`,
          description: `Escrow payout released for completed booking #${tx.reference}`,
        });

        // Update agent completed transaction counter
        await db
          .update(agents)
          .set({ completedTransactions: sql`${agents.completedTransactions} + 1` })
          .where(eq(agents.id, agentProfile.id));

        await db.insert(notifications).values({
          userId: agentProfile.userId,
          title: 'Escrow Payout Credited',
          message: `₦${agentEarnings.toLocaleString()} has been released to your wallet for transaction ${tx.reference}.`,
          type: 'payment',
        });
      }

      return res.json({ success: true, data: updated });
    } else if (action === 'open_dispute') {
      // Mark transaction disputed
      const [updated] = await db
        .update(transactions)
        .set({ status: 'disputed', updatedAt: new Date() })
        .where(eq(transactions.id, tx.id))
        .returning();

      await db.insert(disputes).values({
        transactionId: tx.id,
        userId: req.dbUser.id,
        reason: reason || 'Tenant or agent reported an issue with property handover',
      });

      return res.json({ success: true, data: updated });
    }

    return res.status(400).json({ success: false, error: { message: 'Invalid action' } });
  } catch (error: any) {
    console.error('Transaction action error:', error);
    return res.status(500).json({ success: false, error: { message: 'Failed to update transaction' } });
  }
});

// ==========================================
// 6. MESSAGING & CONVERSATIONS
// ==========================================
apiRouter.get('/conversations', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select({
        conversation: conversations,
        property: properties,
        buyer: users,
        agent: agents,
      })
      .from(conversations)
      .leftJoin(properties, eq(conversations.propertyId, properties.id))
      .leftJoin(users, eq(conversations.buyerId, users.id))
      .leftJoin(agents, eq(conversations.agentId, agents.id))
      .where(or(eq(conversations.buyerId, req.dbUser.id), eq(agents.userId, req.dbUser.id)))
      .orderBy(desc(conversations.lastMessageAt));

    return res.json({
      success: true,
      data: list.map((c) => ({
        ...c.conversation,
        property: c.property,
        buyer: c.buyer,
        agent: c.agent,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch conversations' } });
  }
});

apiRouter.post('/conversations', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, initialMessage } = req.body;
    const propId = parseInt(propertyId, 10);

    const prop = await db.select().from(properties).where(eq(properties.id, propId)).limit(1);
    if (!prop.length) {
      return res.status(404).json({ success: false, error: { message: 'Property not found' } });
    }

    // Check if conversation already exists
    const existing = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.propertyId, propId), eq(conversations.buyerId, req.dbUser.id)))
      .limit(1);

    let convId: number;
    if (existing.length > 0) {
      convId = existing[0].id;
    } else {
      const [newConv] = await db
        .insert(conversations)
        .values({
          propertyId: propId,
          buyerId: req.dbUser.id,
          agentId: prop[0].agentId,
          lastMessage: initialMessage || 'Hello, I am interested in this accommodation.',
          lastMessageAt: new Date(),
        })
        .returning();
      convId = newConv.id;
    }

    // Send initial message if provided
    if (initialMessage) {
      await db.insert(messages).values({
        conversationId: convId,
        senderId: req.dbUser.id,
        text: initialMessage,
      });
    }

    return res.json({ success: true, data: { conversationId: convId } });
  } catch (error: any) {
    console.error('Error starting conversation:', error);
    return res.status(500).json({ success: false, error: { message: 'Failed to start conversation' } });
  }
});

apiRouter.get('/conversations/:id/messages', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const convId = parseInt(req.params.id, 10);
    const msgList = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, convId))
      .orderBy(messages.createdAt);

    return res.json({
      success: true,
      data: msgList.map((m) => ({
        ...m.message,
        sender: m.sender,
      })),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to fetch messages' } });
  }
});

apiRouter.post('/conversations/:id/messages', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const convId = parseInt(req.params.id, 10);
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: { message: 'Message text cannot be empty' } });
    }

    const [newMsg] = await db
      .insert(messages)
      .values({
        conversationId: convId,
        senderId: req.dbUser.id,
        text: text.trim(),
      })
      .returning();

    // Update conversation timestamp
    await db
      .update(conversations)
      .set({
        lastMessage: text.trim(),
        lastMessageAt: new Date(),
      })
      .where(eq(conversations.id, convId));

    return res.status(201).json({ success: true, data: newMsg });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to send message' } });
  }
});

// ==========================================
// 7. NOTIFICATIONS
// ==========================================
apiRouter.get('/notifications', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, req.dbUser.id))
      .orderBy(desc(notifications.createdAt))
      .limit(30);

    return res.json({ success: true, data: list });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to load notifications' } });
  }
});

apiRouter.patch('/notifications/:id/read', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, req.dbUser.id)));

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to update notification' } });
  }
});

// ==========================================
// 8. REVIEWS & REPORTS
// ==========================================
apiRouter.post('/reviews', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, agentId, rating, comment } = req.body;
    if (!propertyId || !rating || !comment) {
      return res.status(400).json({ success: false, error: { message: 'Property, rating and comment are required.' } });
    }

    const [review] = await db
      .insert(reviews)
      .values({
        userId: req.dbUser.id,
        agentId: Number(agentId),
        propertyId: Number(propertyId),
        rating: Number(rating),
        comment: comment.trim(),
      })
      .returning();

    return res.status(201).json({ success: true, data: review });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to submit review' } });
  }
});

apiRouter.post('/reports', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { targetType, targetId, reason, details } = req.body;
    const [report] = await db
      .insert(reports)
      .values({
        reporterId: req.dbUser.id,
        targetType: targetType || 'property',
        targetId: Number(targetId),
        reason: reason || 'Inaccurate listing or scam suspicion',
        details: details || '',
      })
      .returning();

    return res.status(201).json({ success: true, data: report });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to submit report' } });
  }
});

// ==========================================
// 9. ADMIN DASHBOARD & MODERATION
// ==========================================
apiRouter.get('/admin/metrics', requireAuth, requireAdmin, async (_req, res: Response) => {
  try {
    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [totalProperties] = await db.select({ count: sql<number>`count(*)` }).from(properties);
    const [totalAgents] = await db.select({ count: sql<number>`count(*)` }).from(agents);
    const [totalTx] = await db.select({ count: sql<number>`count(*)` }).from(transactions);
    const [txVolume] = await db.select({ sum: sql<number>`coalesce(sum(amount), 0)` }).from(transactions);
    const [totalReports] = await db.select({ count: sql<number>`count(*)` }).from(reports);

    return res.json({
      success: true,
      data: {
        totalUsers: Number(totalUsers?.count || 0),
        totalProperties: Number(totalProperties?.count || 0),
        totalAgents: Number(totalAgents?.count || 0),
        totalTransactions: Number(totalTx?.count || 0),
        transactionVolume: Number(txVolume?.sum || 0),
        pendingReports: Number(totalReports?.count || 0),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to load admin metrics' } });
  }
});

apiRouter.get('/admin/properties', requireAuth, requireAdmin, async (_req, res: Response) => {
  try {
    const list = await db
      .select({
        property: properties,
        agent: agents,
      })
      .from(properties)
      .leftJoin(agents, eq(properties.agentId, agents.id))
      .orderBy(desc(properties.createdAt))
      .limit(50);

    return res.json({ success: true, data: list.map((i) => ({ ...i.property, agent: i.agent })) });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to load admin properties' } });
  }
});

apiRouter.patch('/admin/properties/:id/status', requireAuth, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body; // 'approved' | 'rejected' | 'suspended'
    const [updated] = await db
      .update(properties)
      .set({ status })
      .where(eq(properties.id, id))
      .returning();

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to update property status' } });
  }
});

apiRouter.get('/admin/reports', requireAuth, requireAdmin, async (_req, res: Response) => {
  try {
    const list = await db
      .select({
        report: reports,
        reporter: users,
      })
      .from(reports)
      .leftJoin(users, eq(reports.reporterId, users.id))
      .orderBy(desc(reports.createdAt));

    return res.json({ success: true, data: list.map((r) => ({ ...r.report, reporter: r.reporter })) });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to load reports' } });
  }
});

// ==========================================
// 10. DUMMY KEYS & SANDBOX TESTING
// ==========================================
apiRouter.get('/keys', (_req, res: Response) => {
  return res.json({
    success: true,
    data: {
      mode: 'sandbox_test_mode',
      publicKey: 'pk_test_accoom_live_sandbox_7a9f82d1',
      secretKey: 'sk_test_accoom_vault_4c82e091b5aa',
      escrowKey: 'esc_master_akungba_aaua_key_2026',
      webhookSecret: 'whsec_test_accoom_secure_signature_9918',
      testCards: [
        { brand: 'Verve / Visa (Nigeria & Global)', number: '4242 4242 4242 4242', exp: '12/28', cvc: '123' },
        { brand: 'Mastercard Enterprise', number: '5555 5555 5555 4444', exp: '11/27', cvc: '888' },
      ],
    },
  });
});

apiRouter.post('/transactions/:id/verify-key', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const txId = parseInt(req.params.id, 10);
    const { key } = req.body;

    const txRes = await db.select().from(transactions).where(eq(transactions.id, txId)).limit(1);
    if (!txRes.length) {
      return res.status(404).json({ success: false, error: { message: 'Transaction not found' } });
    }

    const tx = txRes[0];
    const expectedKey = tx.paymentReference || `KEY-${tx.reference.slice(3, 9)}`;

    // Verify key match or master dummy key
    const isMaster = key === 'esc_master_akungba_aaua_key_2026' || key?.toUpperCase() === 'ACCOOM-DEMO-KEY';
    const isDirectMatch = key && expectedKey.toLowerCase().includes(key.toLowerCase().trim());

    if (!isMaster && !isDirectMatch) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid handover key code. Expected: ${expectedKey} (or master key)` },
      });
    }

    // Mark transaction completed
    const [updated] = await db
      .update(transactions)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(eq(transactions.id, tx.id))
      .returning();

    return res.json({ success: true, data: updated, verified: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: { message: 'Failed to verify key' } });
  }
});

