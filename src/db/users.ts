// src/db/users.ts
import { db } from './index.ts';
import { users, wallets } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, name?: string, avatar?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length > 0) {
      return existing[0];
    }

    const [newUser] = await db.insert(users).values({
      uid,
      email: email || '',
      name: name || email?.split('@')[0] || 'ACCOOM User',
      avatar: avatar || '',
      role: email === 'admin@accoom.ng' ? 'ADMIN' : 'USER',
    }).returning();

    // Initialize user wallet
    await db.insert(wallets).values({
      userId: newUser.id,
      balance: 150000, // Welcome demo balance for realistic testing
      currency: 'NGN',
    }).onConflictDoNothing();

    return newUser;
  } catch (error) {
    console.error('getOrCreateUser error:', error);
    throw new Error('Database query failed while synchronizing user profile.', { cause: error });
  }
}

export async function getUserById(id: number) {
  try {
    const res = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return res[0] || null;
  } catch (error) {
    console.error('getUserById error:', error);
    throw new Error('Database query failed while fetching user.', { cause: error });
  }
}
