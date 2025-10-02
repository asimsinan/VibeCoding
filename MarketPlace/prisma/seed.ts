// Database seeding script
// This file contains seed data for the marketplace application

import { PrismaClient } from '../src/lib/generated/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.userPreferences.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.notificationType.deleteMany();

  // Seed notification types
  const notificationTypes = await prisma.notificationType.createMany({
    data: [
      { type: 'PURCHASE_CONFIRMATION', category: 'TRANSACTION' },
      { type: 'SALE_CONFIRMATION', category: 'TRANSACTION' },
      { type: 'PRODUCT_SOLD', category: 'PRODUCT' },
      { type: 'ORDER_SHIPPED', category: 'ORDER' },
      { type: 'ORDER_DELIVERED', category: 'ORDER' },
      { type: 'PAYMENT_RECEIVED', category: 'TRANSACTION' },
      { type: 'LISTING_UPDATED', category: 'PRODUCT' },
      { type: 'SYSTEM_ALERT', category: 'SYSTEM' },
    ],
  });

  // Seed categories
  const categories = await prisma.category.createMany({
    data: [
      { name: 'Electronics', description: 'Electronic devices and accessories' },
      { name: 'Clothing', description: 'Fashion and apparel' },
      { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
      { name: 'Books', description: 'Books and educational materials' },
      { name: 'Sports', description: 'Sports equipment and accessories' },
      { name: 'Automotive', description: 'Car parts and accessories' },
      { name: 'Health & Beauty', description: 'Health and beauty products' },
      { name: 'Toys & Games', description: 'Toys and gaming equipment' },
    ],
  });

  // Seed users with profiles
  const hashedPassword = await hash('password123', 12);

  const user1 = await prisma.user.create({
    data: {
      username: 'john_doe',
      email: 'john@example.com',
      passwordHash: hashedPassword,
      isActive: true,
      profile: {
        create: {
          firstName: 'John',
          lastName: 'Doe',
          bio: 'Tech enthusiast and gadget collector',
          location: 'San Francisco, CA',
          phone: '+1-555-0123',
        },
      },
      preferences: {
        create: {
          email: true,
          push: true,
          sms: false,
          transactionNotifications: true,
          productNotifications: true,
          orderNotifications: true,
          systemNotifications: true,
        },
      },
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'jane_smith',
      email: 'jane@example.com',
      passwordHash: hashedPassword,
      isActive: true,
      profile: {
        create: {
          firstName: 'Jane',
          lastName: 'Smith',
          bio: 'Fashion designer and vintage collector',
          location: 'New York, NY',
          phone: '+1-555-0456',
        },
      },
      preferences: {
        create: {
          email: true,
          push: false,
          sms: true,
          transactionNotifications: true,
          productNotifications: false,
          orderNotifications: true,
          systemNotifications: false,
        },
      },
    },
  });

  const user3 = await prisma.user.create({
    data: {
      username: 'bob_wilson',
      email: 'bob@example.com',
      passwordHash: hashedPassword,
      isActive: true,
      profile: {
        create: {
          firstName: 'Bob',
          lastName: 'Wilson',
          bio: 'Home improvement expert',
          location: 'Austin, TX',
          phone: '+1-555-0789',
        },
      },
      preferences: {
        create: {
          email: false,
          push: true,
          sms: false,
          transactionNotifications: true,
          productNotifications: true,
          orderNotifications: true,
          systemNotifications: true,
        },
      },
    },
  });

  // Seed products - Electronics
  const product1 = await prisma.product.create({
    data: {
      title: 'iPhone 15 Pro',
      description: 'Latest iPhone with titanium design and advanced camera system',
      price: 999.99,
      category: 'Electronics',
      sellerId: user1.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop&ixlib=rb-4.0.3',
      ],
    },
  });

  const product2 = await prisma.product.create({
    data: {
      title: 'MacBook Pro M3',
      description: 'Apple MacBook Pro with M3 chip and 16GB RAM',
      price: 1999.99,
      category: 'Electronics',
      sellerId: user1.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop',
      ],
    },
  });

  const product3 = await prisma.product.create({
    data: {
      title: 'Samsung Galaxy S24 Ultra',
      description: 'Premium Android smartphone with S Pen and 200MP camera',
      price: 1199.99,
      category: 'Electronics',
      sellerId: user1.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Sony WH-1000XM5 Headphones',
      description: 'Industry-leading noise canceling wireless headphones',
      price: 399.99,
      category: 'Electronics',
      sellerId: user1.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'iPad Air 5th Gen',
      description: 'Powerful tablet with M1 chip and Liquid Retina display',
      price: 599.99,
      category: 'Electronics',
      sellerId: user1.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Dell XPS 13 Laptop',
      description: 'Ultra-thin laptop with 13.4" InfinityEdge display',
      price: 1299.99,
      category: 'Electronics',
      sellerId: user1.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop',
      ],
    },
  });

  // Clothing
  await prisma.product.create({
    data: {
      title: 'Vintage Leather Jacket',
      description: 'Authentic vintage leather jacket from the 1980s',
      price: 299.99,
      category: 'Clothing',
      sellerId: user2.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1591047139820-ddb7dd78b9ca?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Designer Denim Jeans',
      description: 'Premium high-waisted skinny jeans in dark wash',
      price: 89.99,
      category: 'Clothing',
      sellerId: user2.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Cashmere Sweater',
      description: 'Luxurious 100% cashmere pullover in navy blue',
      price: 199.99,
      category: 'Clothing',
      sellerId: user2.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571513720946-1acbe33703a8?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Running Sneakers',
      description: 'Lightweight running shoes with responsive cushioning',
      price: 129.99,
      category: 'Clothing',
      sellerId: user2.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Summer Dress',
      description: 'Floral print midi dress perfect for warm weather',
      price: 79.99,
      category: 'Clothing',
      sellerId: user2.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop',
      ],
    },
  });

  // Home & Garden
  const product12 = await prisma.product.create({
    data: {
      title: 'Cordless Drill Set',
      description: 'Professional cordless drill with multiple bits and accessories',
      price: 149.99,
      category: 'Home & Garden',
      sellerId: user3.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1504148455328-c3762d086b19?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Indoor Plant Collection',
      description: 'Set of 5 low-maintenance houseplants for beginners',
      price: 89.99,
      category: 'Home & Garden',
      sellerId: user3.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Smart Home Hub',
      description: 'Central control system for all your smart home devices',
      price: 249.99,
      category: 'Home & Garden',
      sellerId: user3.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&ixlib=rb-4.0.3',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Garden Tool Set',
      description: 'Complete set of stainless steel gardening tools',
      price: 69.99,
      category: 'Home & Garden',
      sellerId: user3.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      ],
    },
  });

  // Books
  const product16 = await prisma.product.create({
    data: {
      title: 'The Psychology of Money',
      description: 'Bestselling book on personal finance and investing',
      price: 16.99,
      category: 'Books',
      sellerId: user1.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Atomic Habits',
      description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones',
      price: 18.99,
      category: 'Books',
      sellerId: user1.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Cookbook Collection',
      description: 'Set of 3 popular cookbooks for home chefs',
      price: 45.99,
      category: 'Books',
      sellerId: user2.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Programming Fundamentals',
      description: 'Complete guide to computer programming for beginners',
      price: 29.99,
      category: 'Books',
      sellerId: user1.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop',
      ],
    },
  });

  // Sports
  const product20 = await prisma.product.create({
    data: {
      title: 'Yoga Mat Premium',
      description: 'Non-slip yoga mat with carrying strap',
      price: 39.99,
      category: 'Sports',
      sellerId: user2.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Basketball',
      description: 'Official size and weight basketball for indoor/outdoor play',
      price: 24.99,
      category: 'Sports',
      sellerId: user2.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop&ixlib=rb-4.0.3',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Dumbbell Set',
      description: 'Adjustable dumbbell set 5-50 lbs per dumbbell',
      price: 199.99,
      category: 'Sports',
      sellerId: user3.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Tennis Racket',
      description: 'Professional tennis racket with premium strings',
      price: 149.99,
      category: 'Sports',
      sellerId: user3.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop',
      ],
    },
  });

  // Automotive
  await prisma.product.create({
    data: {
      title: 'Car Phone Mount',
      description: 'Magnetic phone mount for car dashboard',
      price: 19.99,
      category: 'Automotive',
      sellerId: user1.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1504148455328-c3762d086b19?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Car Floor Mats',
      description: 'All-weather rubber floor mats for SUV',
      price: 79.99,
      category: 'Automotive',
      sellerId: user1.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1504148455328-c3762d086b19?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Bluetooth Car Adapter',
      description: 'Wireless Bluetooth adapter for older car stereo systems',
      price: 34.99,
      category: 'Automotive',
      sellerId: user2.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1504148455328-c3762d086b19?w=800&h=600&fit=crop',
      ],
    },
  });

  // Health & Beauty
  await prisma.product.create({
    data: {
      title: 'Skincare Set',
      description: 'Complete 5-step skincare routine for all skin types',
      price: 89.99,
      category: 'Health & Beauty',
      sellerId: user2.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Hair Dryer Professional',
      description: 'Ionic hair dryer with multiple heat settings',
      price: 129.99,
      category: 'Health & Beauty',
      sellerId: user2.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Essential Oils Kit',
      description: 'Set of 12 therapeutic essential oils with diffuser',
      price: 59.99,
      category: 'Health & Beauty',
      sellerId: user3.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop',
      ],
    },
  });

  // Toys & Games
  const product30 = await prisma.product.create({
    data: {
      title: 'Board Game Collection',
      description: 'Set of 5 popular family board games',
      price: 79.99,
      category: 'Toys & Games',
      sellerId: user3.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1606144042614-2412e5b2d3c4?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'LEGO Architecture Set',
      description: 'LEGO Architecture Statue of Liberty building set',
      price: 119.99,
      category: 'Toys & Games',
      sellerId: user3.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800&h=600&fit=crop',
      ],
    },
  });

  await prisma.product.create({
    data: {
      title: 'Gaming Controller',
      description: 'Wireless gaming controller for PC and console',
      price: 49.99,
      category: 'Toys & Games',
      sellerId: user1.id,
      isAvailable: true,
      images: [
        'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800&h=600&fit=crop',
      ],
    },
  });

  // Seed orders
  const order1 = await prisma.order.create({
    data: {
      buyerId: user2.id,
      sellerId: user1.id,
      productId: product1.id,
      amount: 999.99,
      currency: 'usd',
      status: 'PAID',
      paymentIntentId: 'pi_test_123456789',
    },
  });

  const order2 = await prisma.order.create({
    data: {
      buyerId: user3.id,
      sellerId: user1.id,
      productId: product3.id,
      amount: 1199.99,
      currency: 'usd',
      status: 'SHIPPED',
      paymentIntentId: 'pi_test_987654321',
    },
  });

  await prisma.order.create({
    data: {
      buyerId: user1.id,
      sellerId: user3.id,
      productId: product12.id,
      amount: 149.99,
      currency: 'usd',
      status: 'PENDING',
      paymentIntentId: 'pi_test_456789123',
    },
  });

  await prisma.order.create({
    data: {
      buyerId: user2.id,
      sellerId: user1.id,
      productId: product16.id,
      amount: 16.99,
      currency: 'usd',
      status: 'DELIVERED',
      paymentIntentId: 'pi_test_789123456',
    },
  });

  await prisma.order.create({
    data: {
      buyerId: user3.id,
      sellerId: user2.id,
      productId: product20.id,
      amount: 39.99,
      currency: 'usd',
      status: 'SHIPPED',
      paymentIntentId: 'pi_test_321654987',
    },
  });

  await prisma.order.create({
    data: {
      buyerId: user1.id,
      sellerId: user3.id,
      productId: product30.id,
      amount: 79.99,
      currency: 'usd',
      status: 'PAID',
      paymentIntentId: 'pi_test_654987321',
    },
  });

  // Seed notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: user1.id,
        type: 'SALE_CONFIRMATION',
        title: 'Product Sold!',
        message: 'Your iPhone 15 Pro has been sold to Jane Smith',
        data: { orderId: order1.id, productId: product1.id },
        isRead: false,
      },
      {
        userId: user2.id,
        type: 'PURCHASE_CONFIRMATION',
        title: 'Purchase Confirmed',
        message: 'Your purchase of iPhone 15 Pro has been confirmed',
        data: { orderId: order1.id, productId: product1.id },
        isRead: true,
        readAt: new Date(),
      },
      {
        userId: user2.id,
        type: 'ORDER_SHIPPED',
        title: 'Order Shipped',
        message: 'Your vintage leather jacket has been shipped',
        data: { orderId: order2.id, productId: product2.id },
        isRead: false,
      },
      {
        userId: user3.id,
        type: 'PURCHASE_CONFIRMATION',
        title: 'Purchase Confirmed',
        message: 'Your purchase of vintage leather jacket has been confirmed',
        data: { orderId: order2.id, productId: product2.id },
        isRead: false,
      },
    ],
  });

  console.log('Database seeded successfully!');
  console.log(`Created ${notificationTypes.count} notification types`);
  console.log(`Created ${categories.count} categories`);
  console.log(`Created 3 users with profiles and preferences`);
  console.log(`Created 32 products`);
  console.log(`Created 3 orders`);
  console.log(`Created 4 notifications`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
