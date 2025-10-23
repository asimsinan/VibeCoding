const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: {
        email: 'john@example.com',
        password: hashedPassword,
        name: 'John Smith',
        role: 'USER',
        bio: 'Passionate entrepreneur and tech enthusiast',
      },
    }),
    prisma.user.upsert({
      where: { email: 'sarah@example.com' },
      update: {},
      create: {
        email: 'sarah@example.com',
        password: hashedPassword,
        name: 'Sarah Johnson',
        role: 'USER',
        bio: 'Artist and creative director',
      },
    }),
    prisma.user.upsert({
      where: { email: 'mike@example.com' },
      update: {},
      create: {
        email: 'mike@example.com',
        password: hashedPassword,
        name: 'Mike Chen',
        role: 'USER',
        bio: 'Environmental activist and researcher',
      },
    }),
    prisma.user.upsert({
      where: { email: 'emma@example.com' },
      update: {},
      create: {
        email: 'emma@example.com',
        password: hashedPassword,
        name: 'Emma Wilson',
        role: 'USER',
        bio: 'Music producer and sound engineer',
      },
    }),
    prisma.user.upsert({
      where: { email: 'demo@example.com' },
      update: {},
      create: {
        email: 'demo@example.com',
        password: '$2a$10$mGdpPquar0K62lVmyEnjc.uDOZxLXCn.KGHnDc0mFisz58zGlh656',
        name: 'Demo User',
        role: 'USER',
        bio: 'Demo user for testing',
      },
    }),
  ]);

  console.log('✅ Users created:', users.length);

  // Create sample campaigns
  const campaigns = await Promise.all([
    prisma.campaign.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440001' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: 'Eco-Friendly Smart Home System',
        description: 'Revolutionary smart home automation system that reduces energy consumption by 40% while providing seamless control over all home devices. Our IoT platform integrates solar panels, smart thermostats, and energy-efficient lighting to create the ultimate sustainable living experience.',
        goal: 50000,
        current: 32500,
        deadline: new Date('2025-12-15'),
        category: 'TECHNOLOGY',
        status: 'ACTIVE',
        images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
        ownerId: users[0].id,
        isFeatured: true,
      },
    }),
    prisma.campaign.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440002' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Digital Art Gallery Experience',
        description: 'Immersive virtual reality art gallery featuring works from emerging artists worldwide. Experience art like never before with VR technology, interactive installations, and live artist meet-and-greets.',
        goal: 25000,
        current: 18750,
        deadline: new Date('2026-01-20'),
        category: 'ART',
        status: 'ACTIVE',
        images: ['https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800'],
        ownerId: users[1].id,
        isFeatured: true,
      },
    }),
    prisma.campaign.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440003' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440003',
        title: 'Ocean Cleanup Initiative',
        description: 'Join our mission to clean up plastic waste from the world\'s oceans. We\'re developing innovative cleanup technology and organizing volunteer beach cleanups across coastal communities.',
        goal: 75000,
        current: 42000,
        deadline: new Date('2026-02-28'),
        category: 'HEALTH',
        status: 'ACTIVE',
        images: ['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'],
        ownerId: users[2].id,
        isFeatured: true,
      },
    }),
    prisma.campaign.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440004' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440004',
        title: 'Indie Music Album Production',
        description: 'Recording and producing my debut indie rock album featuring 12 original tracks. The album explores themes of self-discovery, relationships, and personal growth through melodic rock compositions.',
        goal: 15000,
        current: 8750,
        deadline: new Date('2025-12-10'),
        category: 'MUSIC',
        status: 'ACTIVE',
        images: ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800'],
        ownerId: users[3].id,
      },
    }),
    prisma.campaign.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440005' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440005',
        title: 'Educational Coding Bootcamp',
        description: 'Free coding bootcamp for underprivileged youth in urban areas. Teaching web development, mobile app creation, and software engineering skills to prepare students for tech careers.',
        goal: 30000,
        current: 18000,
        deadline: new Date('2026-03-15'),
        category: 'EDUCATION',
        status: 'ACTIVE',
        images: ['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'],
        ownerId: users[0].id,
      },
    }),
    prisma.campaign.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440006' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440006',
        title: 'Sustainable Food Truck',
        description: 'Launching a zero-waste food truck serving locally sourced, organic meals. Our mission is to provide healthy, sustainable dining options while supporting local farmers and reducing food waste.',
        goal: 20000,
        current: 12500,
        deadline: new Date('2025-12-05'),
        category: 'FOOD',
        status: 'ACTIVE',
        images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800'],
        ownerId: users[1].id,
      },
    }),
    prisma.campaign.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440007' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440007',
        title: 'Adventure Travel Documentary',
        description: 'Documentary series exploring remote destinations and cultures around the world. Follow our journey as we discover hidden gems, meet local communities, and share their stories.',
        goal: 40000,
        current: 28000,
        deadline: new Date('2026-04-20'),
        category: 'TRAVEL',
        status: 'ACTIVE',
        images: ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800'],
        ownerId: users[2].id,
      },
    }),
    prisma.campaign.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440008' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440008',
        title: 'Indie Game Development',
        description: 'Creating an atmospheric puzzle-adventure game set in a mysterious forest. Features hand-drawn artwork, immersive sound design, and innovative gameplay mechanics.',
        goal: 35000,
        current: 22000,
        deadline: new Date('2026-05-30'),
        category: 'GAMES',
        status: 'ACTIVE',
        images: ['https://images.unsplash.com/photo-1556438064-2d7646166914?w=800'],
        ownerId: users[3].id,
      },
    }),
    prisma.campaign.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440009' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440009',
        title: 'Mental Health Support App',
        description: 'Mobile application providing 24/7 mental health support, meditation guides, and connection to licensed therapists. Making mental health resources accessible to everyone.',
        goal: 60000,
        current: 45000,
        deadline: new Date('2026-06-15'),
        category: 'HEALTH',
        status: 'ACTIVE',
        images: ['https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800'],
        ownerId: users[0].id,
      },
    }),
    prisma.campaign.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440010' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440010',
        title: 'Community Garden Initiative',
        description: 'Establishing community gardens in urban neighborhoods to promote healthy eating, environmental education, and community bonding. Teaching sustainable gardening practices.',
        goal: 18000,
        current: 12000,
        deadline: new Date('2025-12-25'),
        category: 'OTHER',
        status: 'ACTIVE',
        images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800'],
        ownerId: users[1].id,
      },
    }),
  ]);

  console.log('✅ Campaigns created:', campaigns.length);

  // Create some sample donations with higher amounts for trending campaigns
  const donations = await Promise.all([
    prisma.donation.create({
      data: {
        amount: 5000,
        campaignId: campaigns[0].id,
        donorId: users[1].id,
        paymentMethod: 'CREDIT_CARD',
        message: 'Great project! Looking forward to seeing this come to life.',
      },
    }),
    prisma.donation.create({
      data: {
        amount: 2500,
        campaignId: campaigns[0].id,
        donorId: users[2].id,
        paymentMethod: 'PAYPAL',
        message: 'This will make a huge difference for the environment!',
      },
    }),
    prisma.donation.create({
      data: {
        amount: 3000,
        campaignId: campaigns[1].id,
        donorId: users[0].id,
        paymentMethod: 'CREDIT_CARD',
        message: 'Love the concept!',
      },
    }),
    prisma.donation.create({
      data: {
        amount: 8000,
        campaignId: campaigns[2].id,
        donorId: users[3].id,
        paymentMethod: 'BANK_TRANSFER',
        message: 'Our oceans need this initiative. Thank you!',
      },
    }),
    prisma.donation.create({
      data: {
        amount: 1500,
        campaignId: campaigns[3].id,
        donorId: users[0].id,
        paymentMethod: 'CREDIT_CARD',
        message: 'Can\'t wait to hear the album!',
      },
    }),
    // Add more donations to make campaigns trending
    prisma.donation.create({
      data: {
        amount: 2000,
        campaignId: campaigns[0].id,
        donorId: users[3].id,
        paymentMethod: 'CREDIT_CARD',
        message: 'Amazing innovation!',
      },
    }),
    prisma.donation.create({
      data: {
        amount: 1200,
        campaignId: campaigns[1].id,
        donorId: users[2].id,
        paymentMethod: 'PAYPAL',
        message: 'Art meets technology perfectly!',
      },
    }),
    prisma.donation.create({
      data: {
        amount: 4000,
        campaignId: campaigns[2].id,
        donorId: users[0].id,
        paymentMethod: 'BANK_TRANSFER',
        message: 'Saving our planet one step at a time!',
      },
    }),
  ]);

  console.log('✅ Donations created:', donations.length);

  // Create some sample comments
  const comments = await Promise.all([
    prisma.comment.create({
      data: {
        content: 'This is such an innovative approach to smart home technology! I\'m excited to see how this develops.',
        campaignId: campaigns[0].id,
        authorId: users[1].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'The VR art gallery concept is amazing! This will revolutionize how we experience art.',
        campaignId: campaigns[1].id,
        authorId: users[2].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Thank you for supporting ocean cleanup efforts. Every contribution counts!',
        campaignId: campaigns[2].id,
        authorId: campaigns[2].ownerId,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Love the indie rock vibes! Looking forward to the album release.',
        campaignId: campaigns[3].id,
        authorId: users[0].id,
      },
    }),
  ]);

  console.log('✅ Comments created:', comments.length);

  console.log('🎉 Database seeding completed successfully!');
  console.log(`📊 Created:`);
  console.log(`   - ${users.length} users`);
  console.log(`   - ${campaigns.length} campaigns`);
  console.log(`   - ${donations.length} donations`);
  console.log(`   - ${comments.length} comments`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
