// src/db/seed.ts
import { db } from './index.ts';
import { users, agents, properties, wallets, walletLedger, reviews, notifications } from './schema.ts';
import { count } from 'drizzle-orm';

export async function seedDatabaseIfEmpty() {
  try {
    const existing = await db.select({ value: count() }).from(properties);
    if (existing[0]?.value > 0) {
      console.log('Database already seeded with properties.');
      return;
    }

    console.log('Seeding ACCOOM database with initial data...');

    // 1. Create Demo Agents and Admin
    const [agent1User] = await db.insert(users).values({
      uid: 'agent_tunde_akungba',
      email: 'tunde.properties@accoom.ng',
      name: 'Tunde Balogun',
      role: 'AGENT',
      phone: '+234 803 456 7890',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      location: 'Akungba Akoko, Ondo State',
      bio: 'Leading accredited accommodation specialist serving AAUA students and Akungba residents for over 6 years.',
    }).returning();

    const [agent2User] = await db.insert(users).values({
      uid: 'agent_amaka_lagos',
      email: 'amaka.realty@accoom.ng',
      name: 'Amaka Okafor',
      role: 'AGENT',
      phone: '+234 812 345 6789',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
      location: 'Lekki Phase 1, Lagos',
      bio: 'Premium urban housing and verified corporate rentals across Lagos & Abuja.',
    }).returning();

    const [agent3User] = await db.insert(users).values({
      uid: 'agent_dare_akure',
      email: 'dare.realtors@accoom.ng',
      name: 'Dare Adeleke',
      role: 'AGENT',
      phone: '+234 809 123 4567',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      location: 'Alagbaka GRA, Akure',
      bio: 'Residential specialist in high-end estates in Akure and Ondo metropolis.',
    }).returning();

    const [adminUser] = await db.insert(users).values({
      uid: 'accoom_admin_demo',
      email: 'admin@accoom.ng',
      name: 'ACCOOM Compliance Admin',
      role: 'ADMIN',
      phone: '+234 800 000 2226',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
      location: 'Headquarters, Nigeria',
      bio: 'Marketplace security, moderation and escrow compliance officer.',
    }).returning();

    // 2. Insert Agent records
    const [agent1] = await db.insert(agents).values({
      userId: agent1User.id,
      businessName: 'Balogun Prime Housing Ltd',
      tier: 'Pro',
      verified: true,
      rating: '4.9',
      reviewCount: 48,
      completedTransactions: 62,
      responseTime: '< 30 mins',
      responseRate: '99%',
      bio: 'Accredited student housing agent in Akungba Akoko. Fast physical inspections and zero double-allocation guarantee.',
      location: 'Akungba Akoko, Ondo State',
      phone: '+234 803 456 7890',
    }).returning();

    const [agent2] = await db.insert(agents).values({
      userId: agent2User.id,
      businessName: 'Okafor Luxury Properties',
      tier: 'Master',
      verified: true,
      rating: '5.0',
      reviewCount: 84,
      completedTransactions: 110,
      responseTime: '< 15 mins',
      responseRate: '100%',
      bio: 'Verified luxury residential broker specializing in serviced apartments in Lagos and Abuja.',
      location: 'Lekki & VI, Lagos',
      phone: '+234 812 345 6789',
    }).returning();

    const [agent3] = await db.insert(agents).values({
      userId: agent3User.id,
      businessName: 'Adeleke & Sons Properties',
      tier: 'Rising',
      verified: true,
      rating: '4.8',
      reviewCount: 22,
      completedTransactions: 31,
      responseTime: '< 1 hour',
      responseRate: '96%',
      bio: 'Specialist in affordable student lodges and executive apartments in Ondo State.',
      location: 'Akure / Akungba, Ondo',
      phone: '+234 809 123 4567',
    }).returning();

    // 3. Insert Wallets for users
    await db.insert(wallets).values([
      { userId: agent1User.id, balance: 420000, currency: 'NGN' },
      { userId: agent2User.id, balance: 1250000, currency: 'NGN' },
      { userId: agent3User.id, balance: 280000, currency: 'NGN' },
      { userId: adminUser.id, balance: 95000, currency: 'NGN' },
    ]);

    // 4. Insert Properties
    const propertyList = [
      {
        agentId: agent1.id,
        title: 'Executive Self-Contain Lodge near AAUA Permanent Site Gate',
        slug: 'executive-self-contain-lodge-aaua-gate-akungba',
        description: 'Brand new self-contain apartment located only 4 minutes walk to the AAUA Main Campus Gate. Features constant running borehole water, individual pre-paid electricity meter, tiled interior, kitchen cabinets, private balcony, security fence with razor wire, and dedicated night security watchman.',
        propertyType: 'Self-Contained',
        locationCity: 'Akungba',
        locationState: 'Ondo State',
        locationArea: 'Permanent Site Gate',
        address: 'Plot 14, University Crescent, Akungba Akoko',
        price: 180000,
        currency: 'NGN',
        pricingPeriod: 'year',
        bedrooms: 1,
        bathrooms: 1,
        furnished: false,
        verified: true,
        status: 'approved',
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1000&q=80'
        ],
        amenities: ['Running Borehole Water', 'Pre-paid Meter', 'Security Fence', 'Private Balcony', 'Night Watchman', 'Tiled Floors', 'Kitchen Cabinets'],
        rules: 'Quiet hours after 10:00 PM. No unauthorized subletting. Annual renewal subject to property inspection.',
        viewCount: 342,
      },
      {
        agentId: agent1.id,
        title: 'Modern 2-Bedroom Flat in Serene Residential Neighborhood',
        slug: 'modern-2-bedroom-flat-medoline-akungba',
        description: 'Spacious and well-aerated 2-bedroom flat ideal for postgraduate students, lecturers, or young professionals. Features large living room, pop ceiling, fitted kitchen, master bedroom en-suite, constant running water, and standby generator hookup point.',
        propertyType: '2 Bedroom Flat',
        locationCity: 'Akungba',
        locationState: 'Ondo State',
        locationArea: 'Medoline Axis',
        address: '18 Medoline Avenue, Akungba Akoko',
        price: 320000,
        currency: 'NGN',
        pricingPeriod: 'year',
        bedrooms: 2,
        bathrooms: 2,
        furnished: false,
        verified: true,
        status: 'approved',
        images: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
        ],
        amenities: ['Water Storage Tanks', 'Dedicated Transformer', 'Parking Space', 'En-suite Rooms', 'Gated Compound', 'Balcony'],
        rules: 'Pets allowed upon prior notification. Generator usage between 7pm - 12am allowed.',
        viewCount: 219,
      },
      {
        agentId: agent3.id,
        title: 'Budget Friendly Room & Parlour Self-Contain',
        slug: 'budget-room-parlour-ebira-camp-akungba',
        description: 'Affordable room and parlour with private bathroom and kitchen. Ideal for students seeking privacy and low utility expenses. Located along the accessible Ebira camp campus corridor.',
        propertyType: 'Room & Parlour',
        locationCity: 'Akungba',
        locationState: 'Ondo State',
        locationArea: 'Ebira Camp Road',
        address: '5 Ebira Road, Akungba Akoko',
        price: 130000,
        currency: 'NGN',
        pricingPeriod: 'year',
        bedrooms: 1,
        bathrooms: 1,
        furnished: false,
        verified: true,
        status: 'approved',
        images: [
          'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1000&q=80'
        ],
        amenities: ['Borehole Water', 'Fenced Gate', 'Good Cross Ventilation', 'Low Light Bills'],
        rules: 'Smoking prohibited inside compound.',
        viewCount: 187,
      },
      {
        agentId: agent3.id,
        title: 'Luxury 3-Bedroom Serviced Villa in Alagbaka GRA',
        slug: 'luxury-3-bedroom-serviced-villa-alagbaka-akure',
        description: 'Prestigious duplex home in the heart of government reserved area in Akure. Features manicured lawn, dedicated solar inverter power system, treated water filtration, modern granite kitchen, and smart automated security access.',
        propertyType: 'Duplex',
        locationCity: 'Akure',
        locationState: 'Ondo State',
        locationArea: 'Alagbaka GRA',
        address: '12 Presidential Boulevard, Alagbaka, Akure',
        price: 1850000,
        currency: 'NGN',
        pricingPeriod: 'year',
        bedrooms: 3,
        bathrooms: 3,
        furnished: true,
        verified: true,
        status: 'approved',
        images: [
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80'
        ],
        amenities: ['Solar Power Backup', 'Air Conditioning', 'Treated Water', 'Car Port (4 cars)', 'Fibre Internet', 'CCTV System', 'Furnished'],
        rules: 'Corporate or family tenants preferred.',
        viewCount: 520,
      },
      {
        agentId: agent2.id,
        title: 'Waterfront Penthouse Studio with Panoramic City Skyline View',
        slug: 'waterfront-penthouse-studio-lekki-lagos',
        description: 'High-end fully furnished luxury studio apartment located in Lekki Phase 1. Features 24-hour uninterrupted power supply, rooftop infinity pool, fully equipped fitness center, concierge service, and smart home lighting controls.',
        propertyType: 'Studio',
        locationCity: 'Lagos',
        locationState: 'Lagos State',
        locationArea: 'Lekki Phase 1',
        address: 'Admiralty Way, Lekki Phase 1, Lagos',
        price: 3500000,
        currency: 'NGN',
        pricingPeriod: 'year',
        bedrooms: 1,
        bathrooms: 1,
        furnished: true,
        verified: true,
        status: 'approved',
        images: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1000&q=80'
        ],
        amenities: ['24/7 Electricity', 'Swimming Pool', 'Gym', 'High Speed Wi-Fi', 'Smart TV', 'Elevator', '24/7 Armed Security'],
        rules: 'Short lets or annual lease available. Strict non-smoking indoors.',
        viewCount: 890,
      },
      {
        agentId: agent2.id,
        title: 'Diplomatic 2-Bedroom Executive Residence in Maitama',
        slug: 'diplomatic-2-bedroom-executive-maitama-abuja',
        description: 'Exquisite modern 2-bedroom apartment situated in the high-security district of Maitama, Abuja. Top-tier finishings, private garden access, standby industrial generator, automated gate, and dedicated facility management.',
        propertyType: '2 Bedroom Flat',
        locationCity: 'Abuja',
        locationState: 'Federal Capital Territory',
        locationArea: 'Maitama District',
        address: 'Shehu Shagari Way, Maitama, Abuja',
        price: 4200000,
        currency: 'NGN',
        pricingPeriod: 'year',
        bedrooms: 2,
        bathrooms: 2,
        furnished: true,
        verified: true,
        status: 'approved',
        images: [
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1000&q=80'
        ],
        amenities: ['24/7 Power', 'Central Air Conditioning', 'En-suite Bathrooms', 'Facility Management', 'Intercom', 'CCTV Security'],
        rules: 'Diplomatic and corporate lease terms available.',
        viewCount: 440,
      }
    ];

    const insertedProps = await db.insert(properties).values(propertyList).returning();

    // 5. Insert sample reviews
    if (insertedProps.length > 0) {
      await db.insert(reviews).values([
        {
          userId: adminUser.id,
          agentId: agent1.id,
          propertyId: insertedProps[0].id,
          rating: 5,
          comment: 'Rented through ACCOOM escrow. Fast inspection, water runs 24 hours, and landlord is very cooperative. Highly recommended for students!',
        },
        {
          userId: adminUser.id,
          agentId: agent2.id,
          propertyId: insertedProps[4].id,
          rating: 5,
          comment: 'Seamless booking and exact match with photos. The 24/7 power in Lekki made working remotely completely worry-free.',
        }
      ]);

      // 6. Insert sample notifications
      await db.insert(notifications).values([
        {
          userId: agent1User.id,
          title: 'Welcome to ACCOOM Marketplace',
          message: 'Your agent profile has been verified as a Pro partner in Akungba Akoko. Your listings are now featured.',
          type: 'system',
        },
        {
          userId: agent2User.id,
          title: 'New Property Inquiry',
          message: 'A prospective tenant viewed your Waterfront Penthouse Studio in Lekki.',
          type: 'message',
        }
      ]);
    }

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed database error:', error);
  }
}
