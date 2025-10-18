import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Clear existing data
  await prisma.placedFurniture.deleteMany();
  await prisma.designReport.deleteMany();
  await prisma.sharedDesign.deleteMany();
  await prisma.design.deleteMany();
  await prisma.roomPhoto.deleteMany();
  await prisma.furnitureItem.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('User123!', 10);

  await prisma.user.create({
    data: {
      email: 'admin@ardecorator.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
    },
  });


  const user = await prisma.user.create({
    data: {
      email: 'user@ardecorator.com',
      password: userPassword,
      name: 'Test User',
      role: 'user',
    },
  });
  console.log('✅ Test user created: user@ardecorator.com');

  // Create furniture items with real images
  console.log('Creating furniture items...');

  const furnitureData = [
    // Seating
    {
      name: 'Modern Velvet Sofa',
      description: 'Luxurious 3-seater velvet sofa in navy blue with gold legs',
      category: 'seating',
      style: 'Modern',
      price: 1299.99,
      dimensions: JSON.stringify({ width: 2.1, height: 0.85, depth: 0.95 }),
      modelUrl: 'https://example.com/models/sofa1.glb',
      thumbnailUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop',
    },
    {
      name: 'Scandinavian Armchair',
      description: 'Minimalist wooden armchair with cream cushion',
      category: 'seating',
      style: 'Scandinavian',
      price: 399.99,
      dimensions: JSON.stringify({ width: 0.75, height: 0.85, depth: 0.80 }),
      modelUrl: 'https://example.com/models/armchair1.glb',
      thumbnailUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400&h=400&fit=crop',
    },
    {
      name: 'Green Egg Chair',
      description: 'Modern green egg-shaped chair with comfortable upholstery',
      category: 'seating',
      style: 'Modern',
      price: 549.99,
      dimensions: JSON.stringify({ width: 0.70, height: 0.90, depth: 0.75 }),
      modelUrl: 'https://example.com/models/chair1.glb',
      thumbnailUrl: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&h=400&fit=crop',
    },

    // Tables
    {
      name: 'Oak Dining Table',
      description: 'Solid oak dining table seats 6-8 people',
      category: 'tables',
      style: 'Rustic',
      price: 899.99,
      dimensions: JSON.stringify({ width: 1.8, height: 0.75, depth: 0.90 }),
      modelUrl: 'https://example.com/models/table1.glb',
      thumbnailUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&h=400&fit=crop',
    },
    {
      name: 'Glass Coffee Table',
      description: 'Modern glass top coffee table with chrome legs',
      category: 'tables',
      style: 'Modern',
      price: 349.99,
      dimensions: JSON.stringify({ width: 1.2, height: 0.45, depth: 0.60 }),
      modelUrl: 'https://example.com/models/coffeetable1.glb',
      thumbnailUrl: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=400&h=400&fit=crop',
    },
    {
      name: 'Marble Side Table',
      description: 'Elegant white marble side table with gold base',
      category: 'tables',
      style: 'Contemporary',
      price: 279.99,
      dimensions: JSON.stringify({ width: 0.50, height: 0.55, depth: 0.50 }),
      modelUrl: 'https://example.com/models/sidetable1.glb',
      thumbnailUrl: 'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=400&h=400&fit=crop',
    },

    // Storage
    {
      name: 'Mid-Century Bookshelf',
      description: 'Walnut wood bookshelf with 5 shelves',
      category: 'storage',
      style: 'Mid-Century',
      price: 649.99,
      dimensions: JSON.stringify({ width: 1.0, height: 2.0, depth: 0.35 }),
      modelUrl: 'https://example.com/models/bookshelf1.glb',
      thumbnailUrl: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400&h=400&fit=crop',
    },
    {
      name: 'Modern TV Console',
      description: 'White and wood TV stand with drawers',
      category: 'storage',
      style: 'Modern',
      price: 499.99,
      dimensions: JSON.stringify({ width: 1.6, height: 0.50, depth: 0.40 }),
      modelUrl: 'https://example.com/models/tvconsole1.glb',
      thumbnailUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop',
    },
    {
      name: 'Vintage Dresser',
      description: '6-drawer wooden dresser with brass handles',
      category: 'storage',
      style: 'Vintage',
      price: 799.99,
      dimensions: JSON.stringify({ width: 1.2, height: 0.90, depth: 0.50 }),
      modelUrl: 'https://example.com/models/dresser1.glb',
      thumbnailUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop',
    },

    // Lighting
    {
      name: 'Crystal Chandelier',
      description: 'Elegant crystal chandelier with 6 lights',
      category: 'lighting',
      style: 'Classic',
      price: 899.99,
      dimensions: JSON.stringify({ width: 0.70, height: 0.80, depth: 0.70 }),
      modelUrl: 'https://example.com/models/chandelier1.glb',
      thumbnailUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=400&fit=crop',
    },
    {
      name: 'Industrial Floor Lamp',
      description: 'Black metal tripod floor lamp',
      category: 'lighting',
      style: 'Industrial',
      price: 189.99,
      dimensions: JSON.stringify({ width: 0.50, height: 1.60, depth: 0.50 }),
      modelUrl: 'https://example.com/models/floorlamp1.glb',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop',
    },
    {
      name: 'Modern Table Lamp',
      description: 'Minimalist white ceramic table lamp',
      category: 'lighting',
      style: 'Modern',
      price: 79.99,
      dimensions: JSON.stringify({ width: 0.25, height: 0.45, depth: 0.25 }),
      modelUrl: 'https://example.com/models/tablelamp1.glb',
      thumbnailUrl: 'https://images.unsplash.com/photo-1534105615256-13940a2e6e0b?w=400&h=400&fit=crop',
    },

    // Decor
    {
      name: 'Large Wall Mirror',
      description: 'Round gold-framed wall mirror 36 inch diameter',
      category: 'decor',
      style: 'Contemporary',
      price: 249.99,
      dimensions: JSON.stringify({ width: 0.90, height: 0.90, depth: 0.05 }),
      modelUrl: 'https://example.com/models/mirror1.glb',
      thumbnailUrl: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=400&fit=crop',
    },
    {
      name: 'Mona Lisa Wall Art',
      description: 'Classic Mona Lisa painting reproduction for wall decoration',
      category: 'decor',
      style: 'Classic',
      price: 299.99,
      dimensions: JSON.stringify({ width: 1.2, height: 0.90, depth: 0.05 }),
      modelUrl: 'https://example.com/models/monalisa.glb',
      thumbnailUrl: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=400&fit=crop',
    },
    {
      name: 'Moroccan Area Rug',
      description: 'Handwoven wool rug with geometric pattern',
      category: 'decor',
      style: 'Bohemian',
      price: 449.99,
      dimensions: JSON.stringify({ width: 2.4, height: 0.01, depth: 1.8 }),
      modelUrl: 'https://example.com/models/rug1.glb',
      thumbnailUrl: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=400&h=400&fit=crop',
    },
  ];

  for (const furniture of furnitureData) {
    await prisma.furnitureItem.create({ data: furniture });
  }
  console.log(`✅ Created ${furnitureData.length} furniture items`);

  // Create a sample room photo with real image
  const roomPhoto = await prisma.roomPhoto.create({
    data: {
      userId: user.id,
      filename: 'living-room.jpg',
      url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
      status: 'ready',
      dimensions: JSON.stringify({ width: 800, height: 600 }),
      surfaces: JSON.stringify({
        floor: { area: 20, material: 'hardwood' },
        walls: [
          { area: 15, material: 'painted' },
          { area: 15, material: 'painted' },
        ],
      }),
    },
  });
  console.log('✅ Sample room photo created');

  // Create a sample design
  const furniture = await prisma.furnitureItem.findMany({ take: 3 });
  const design = await prisma.design.create({
    data: {
      userId: user.id,
      roomPhotoId: roomPhoto.id,
      name: 'Modern Living Room',
      totalCost: furniture.reduce((sum, item) => sum + item.price, 0),
    },
  });

  // Add placed furniture to the design
  for (let i = 0; i < furniture.length; i++) {
    await prisma.placedFurniture.create({
      data: {
        designId: design.id,
        furnitureId: furniture[i].id,
        position: JSON.stringify({ x: i * 2, y: 0, z: 0 }),
        rotation: JSON.stringify({ x: 0, y: 0, z: 0 }),
        scale: 1.0,
      },
    });
  }
  console.log('✅ Sample design created with placed furniture');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('Admin: admin@ardecorator.com / admin123');
  console.log('User:  user@ardecorator.com / User123!\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
